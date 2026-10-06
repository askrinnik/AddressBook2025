using System.Text;
using System.Text.Json;

namespace AddressBook.Web.ErrorHandling;

public class ProblemDetailsHandler : DelegatingHandler
{
    // An error body larger than this is not a problem document; reading it all would only buffer it in the browser.
    private const int MaxBodyBytes = 64 * 1024;

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken);

        if (response.IsSuccessStatusCode)
            return response;

        var body = await ReadBodyAsync(response, cancellationToken);
        var problemDetails = ParseOrFallback(body, response);
        response.Dispose();
        throw new ProblemDetailsException(problemDetails);
    }

    private static async Task<string> ReadBodyAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var buffer = new byte[MaxBodyBytes];
        var length = 0;
        int read;
        while (length < buffer.Length
               && (read = await stream.ReadAsync(buffer.AsMemory(length), cancellationToken)) > 0)
        {
            length += read;
        }

        return Encoding.UTF8.GetString(buffer, 0, length);
    }

    /// <summary>
    /// Parses the body as problem details. Gateways and proxies answer with an empty, HTML or plain-text
    /// body, so anything that does not parse becomes a problem built from the response status line, and
    /// a parsed problem missing its title or status takes them from the status line too.
    /// </summary>
    private static ClientProblemDetails ParseOrFallback(string body, HttpResponseMessage response)
    {
        ClientProblemDetails? problemDetails = null;
        try
        {
            problemDetails = body.ToProblemDetails();
        }
        catch (JsonException)
        {
        }

        problemDetails ??= new ClientProblemDetails();
        if (string.IsNullOrWhiteSpace(problemDetails.Title))
            problemDetails.Title = string.IsNullOrWhiteSpace(response.ReasonPhrase) ? response.StatusCode.ToString() : response.ReasonPhrase;
        problemDetails.Status ??= (int)response.StatusCode;

        return problemDetails;
    }
}
