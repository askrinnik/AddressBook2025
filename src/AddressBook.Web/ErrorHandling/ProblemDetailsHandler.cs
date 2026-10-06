using System.Text.Json;

namespace AddressBook.Web.ErrorHandling;

public class ProblemDetailsHandler : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken);

        if (response.IsSuccessStatusCode)
            return response;

        var body = await response.Content.ReadAsStringAsync(cancellationToken: cancellationToken);
        throw new ProblemDetailsException(ParseOrFallback(body, response));
    }

    /// <summary>
    /// Parses the body as problem details. Gateways and proxies answer with an empty, HTML or plain-text
    /// body, so anything that does not parse becomes a problem built from the response status line.
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

        var statusCode = (int)response.StatusCode;
        problemDetails ??= new ClientProblemDetails
        {
            Title = string.IsNullOrWhiteSpace(response.ReasonPhrase) ? response.StatusCode.ToString() : response.ReasonPhrase
        };
        problemDetails.Status ??= statusCode;

        return problemDetails;
    }
}
