namespace AddressBook.Web.ErrorHandling;

public class ProblemDetailsHandler : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken);

        if (response.IsSuccessStatusCode)
            return response;
        
        var problemDetailsString = await response.Content.ReadAsStringAsync(cancellationToken: cancellationToken);
        var problemDetails = problemDetailsString.ToProblemDetails();
        throw new ProblemDetailsException(problemDetails);
    }
}