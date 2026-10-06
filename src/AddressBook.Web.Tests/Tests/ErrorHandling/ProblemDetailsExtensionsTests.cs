using AddressBook.Web.ErrorHandling;

namespace AddressBook.Web.Tests.Tests.ErrorHandling;

public class ProblemDetailsExtensionsTests
{
    [Fact]
    public void GetErrors_WithErrorsExtension_ReturnsFieldMessages()
    {
        var problem = """{"status":400,"errors":{"FirstName":["Required"]}}""".ToProblemDetails()!;

        Assert.Equal(["Required"], problem.GetErrors()["FirstName"]);
    }

    [Fact]
    public void GetErrors_WithoutErrorsExtension_ReturnsEmpty()
    {
        var problem = """{"title":"Bad Request","status":400,"traceId":"abc"}""".ToProblemDetails()!;

        Assert.Empty(problem.GetErrors());
    }

    [Theory]
    [InlineData("""{"status":400,"errors":"Bad input"}""")]
    [InlineData("""{"status":400,"errors":["Bad input"]}""")]
    [InlineData("""{"status":400,"errors":{"FirstName":"Required"}}""")]
    public void GetErrors_WithErrorsOfUnexpectedShape_ReturnsEmpty(string body)
    {
        var problem = body.ToProblemDetails()!;

        Assert.Empty(problem.GetErrors());
    }

    [Fact]
    public void GetErrors_WithoutAnyExtensions_ReturnsEmpty()
    {
        var problem = """{"title":"Bad Request","status":400}""".ToProblemDetails()!;

        Assert.Empty(problem.GetErrors());
    }
}
