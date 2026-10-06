using System.Net;
using System.Net.Http.Json;
using AddressBook.Web.ErrorHandling;

namespace AddressBook.Web.Tests.Specs.Infrastructure;

public class FakeHttpMessageHandlerTests
{
    [Fact]
    public async Task Respond_ReturnsConfiguredStatus_AndRecordsRequest()
    {
        using var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.NoContent);
        using var client = handler.CreateClient();

        var response = await client.PutAsJsonAsync("contacts/5", new { FirstName = "Ann" }, Xunit.TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var request = Assert.Single(handler.Requests);
        Assert.Equal(HttpMethod.Put, request.Method);
        Assert.Equal("http://localhost:5000/api/contacts/5", request.Uri!.ToString());
        Assert.Contains("Ann", request.Body);
    }

    [Fact]
    public async Task RespondCreated_SetsLocationHeader()
    {
        using var handler = new FakeHttpMessageHandler().RespondCreated("http://localhost:5000/api/contacts/42");
        using var client = handler.CreateClient();

        var response = await client.PostAsJsonAsync("contacts", new { }, Xunit.TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Equal("42", response.Headers.Location!.Segments[^1]);
    }

    [Fact]
    public async Task RespondJson_ReturnsBody()
    {
        using var handler = new FakeHttpMessageHandler().RespondJson(HttpStatusCode.OK, new { Id = 7 });
        using var client = handler.CreateClient();

        var json = await client.GetStringAsync("contacts/7", Xunit.TestContext.Current.CancellationToken);

        Assert.Contains("\"id\":7", json);
    }

    [Fact]
    public async Task RespondProblem_WithProblemDetailsHandler_ThrowsProblemDetailsException()
    {
        var errors = new Dictionary<string, string[]> { ["FirstName"] = ["Required"] };
        using var handler = new FakeHttpMessageHandler().RespondProblem(HttpStatusCode.NotFound, "Not Found", "no such contact", errors);
        using var client = handler.CreateClient();

        var ex = await Assert.ThrowsAsync<ProblemDetailsException>(() => client.GetAsync("contacts/1", Xunit.TestContext.Current.CancellationToken));

        Assert.Equal(404, ex.ProblemDetails!.Status);
        Assert.Equal("Not Found", ex.ProblemDetails.Title);
        Assert.Equal("no such contact", ex.ProblemDetails.Detail);
        Assert.Equal(["Required"], ex.ProblemDetails.GetErrors()["FirstName"]);
    }

    [Fact]
    public async Task RespondProblem_WithoutProblemDetailsHandler_ReturnsRawResponse()
    {
        using var handler = new FakeHttpMessageHandler().RespondProblem(HttpStatusCode.BadRequest, "Bad");
        using var client = handler.CreateClient(withProblemDetails: false);

        var response = await client.GetAsync("contacts", Xunit.TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType!.MediaType);
    }

    [Fact]
    public async Task Enqueue_TakesPriorityOverDefault_ThenFallsBack()
    {
        using var handler = new FakeHttpMessageHandler().Respond(HttpStatusCode.OK).Enqueue(HttpStatusCode.Accepted);
        using var client = handler.CreateClient();

        var first = await client.GetAsync("a", Xunit.TestContext.Current.CancellationToken);
        var second = await client.GetAsync("b", Xunit.TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.Accepted, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(2, handler.Requests.Count);
    }

    [Fact]
    public async Task CreateService_UsesHandler()
    {
        using var handler = new FakeHttpMessageHandler().RespondCreated("http://localhost:5000/api/contacts/9");
        var service = handler.CreateService();

        var id = await service.CreateContact(new() { FirstName = "A", LastName = "B" });

        Assert.Equal(9, id);
    }
}
