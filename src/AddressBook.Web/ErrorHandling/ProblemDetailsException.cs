namespace AddressBook.Web.ErrorHandling;

public class ProblemDetailsException(ClientProblemDetails? problemDetails) : Exception
{
    public ClientProblemDetails? ProblemDetails { get; } = problemDetails;
}