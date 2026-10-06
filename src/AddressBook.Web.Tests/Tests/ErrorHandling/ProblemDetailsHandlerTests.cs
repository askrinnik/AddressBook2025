using System.Net;
using AddressBook.Web.ErrorHandling;

namespace AddressBook.Web.Tests.Tests.ErrorHandling;

public class ProblemDetailsHandlerTests
{
    private static CancellationToken Ct => Xunit.TestContext.Current.CancellationToken;

    private static async Task<ProblemDetailsException> SendAsync(FakeHttpMessageHandler handler)
    {
        using var client = handler.CreateClient();
        return await Assert.ThrowsAsync<ProblemDetailsException>(() => client.GetAsync("contacts", Ct));
    }

    [Fact]
    public async Task Success_ReturnsResponseUnchanged()
    {
        var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.NoContent);
        using var client = handler.CreateClient();

        var response = await client.GetAsync("contacts", Ct);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task ProblemJson_ThrowsWithParsedProblem()
    {
        var handler = new FakeHttpMessageHandler().RespondProblem(HttpStatusCode.BadRequest, "Validation failed", "Bad input");

        var ex = await SendAsync(handler);

        Assert.Equal(400, ex.ProblemDetails!.Status);
        Assert.Equal("Validation failed", ex.ProblemDetails.Title);
        Assert.Equal("Bad input", ex.ProblemDetails.Detail);
    }

    [Theory]
    [InlineData(HttpStatusCode.Unauthorized, "Unauthorized")]
    [InlineData(HttpStatusCode.MethodNotAllowed, "Method Not Allowed")]
    [InlineData(HttpStatusCode.NotFound, "Not Found")]
    [InlineData(HttpStatusCode.InternalServerError, "Internal Server Error")]
    public async Task EmptyBody_ThrowsWithStatusAndReasonPhrase(HttpStatusCode status, string reasonPhrase)
    {
        var handler = new FakeHttpMessageHandler().Respond(status);

        var ex = await SendAsync(handler);

        Assert.Equal((int)status, ex.ProblemDetails!.Status);
        Assert.Equal(reasonPhrase, ex.ProblemDetails.Title);
    }

    [Fact]
    public async Task HtmlBody_ThrowsWithStatusAndReasonPhrase()
    {
        var handler = new FakeHttpMessageHandler()
            .RespondBody(HttpStatusCode.BadGateway, "<html><body>502 Bad Gateway</body></html>", "text/html");

        var ex = await SendAsync(handler);

        Assert.Equal(502, ex.ProblemDetails!.Status);
        Assert.Equal("Bad Gateway", ex.ProblemDetails.Title);
        Assert.Null(ex.ProblemDetails.Detail);
    }

    [Fact]
    public async Task PlainTextBody_ThrowsWithStatusAndReasonPhrase()
    {
        var handler = new FakeHttpMessageHandler()
            .RespondBody(HttpStatusCode.GatewayTimeout, "upstream timed out", "text/plain");

        var ex = await SendAsync(handler);

        Assert.Equal(504, ex.ProblemDetails!.Status);
        Assert.Equal("Gateway Timeout", ex.ProblemDetails.Title);
    }

    [Theory]
    [InlineData("null")]
    [InlineData("[]")]
    [InlineData("\"text\"")]
    public async Task JsonThatIsNotAProblemObject_ThrowsWithStatusAndReasonPhrase(string body)
    {
        var handler = new FakeHttpMessageHandler().RespondBody(HttpStatusCode.NotFound, body, "application/json");

        var ex = await SendAsync(handler);

        Assert.Equal(404, ex.ProblemDetails!.Status);
        Assert.Equal("Not Found", ex.ProblemDetails.Title);
    }

    [Fact]
    public async Task JsonObjectWithoutStatus_TakesStatusFromResponse()
    {
        var handler = new FakeHttpMessageHandler()
            .RespondBody(HttpStatusCode.NotFound, """{"title":"Nothing here"}""", "application/json");

        var ex = await SendAsync(handler);

        Assert.Equal(404, ex.ProblemDetails!.Status);
        Assert.Equal("Nothing here", ex.ProblemDetails.Title);
    }
}
