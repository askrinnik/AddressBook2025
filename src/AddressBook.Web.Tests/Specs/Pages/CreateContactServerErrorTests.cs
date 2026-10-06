using System.Net;
using AddressBook.Web.ErrorHandling;
using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Specs.Pages;

public class CreateContactServerErrorTests : MudTestContext
{
    private const string InitialPath = "/create-contact";

    private async Task<ContactFormHarness> RenderFilledFormAsync()
    {
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo(InitialPath);
        var form = new ContactFormHarness(Render<CreateContact>());
        return await form.FillAsync(ContactBuilder.New.Valid());
    }

    private static ProblemDetailsException ValidationProblem(string errorsJson) =>
        new(("{\"title\":\"One or more validation errors occurred.\",\"status\":400,\"errors\":{" + errorsJson + "}}").ToProblemDetails());

    [Fact]
    public async Task Submit_ServerReturnsFieldError_ShowsMessageOnThatField_AndStaysOnPage()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(ValidationProblem("""
            "FirstName":["First name is already taken."]
            """));

        form.Submit();

        Assert.Contains("First name is already taken.", form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
    }

    [Fact]
    public async Task Submit_ServerReturnsErrorsForSeveralFields_ShowsMessageOnEachField()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(ValidationProblem("""
            "FirstName":["First name is too long."],
            "LastName":["Last name is too long."]
            """));

        form.Submit();

        Assert.Contains("First name is too long.", form.ValidationMessages);
        Assert.Contains("Last name is too long.", form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
    }

    [Fact]
    public async Task Submit_ServerReturnsError_EnablesSubmitButtonAgain()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(ValidationProblem("""
            "LastName":["Last name is too long."]
            """));

        form.Submit();

        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public async Task Submit_ProblemDetailsWithoutBody_ShowsNoMessages_AndStaysOnPage()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(new ProblemDetailsException(null));

        form.Submit();

        Assert.Empty(form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public async Task Submit_UnexpectedException_ShowsItsMessageAsGeneralError_AndStaysOnPage()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(new HttpRequestException("Service unavailable"));

        form.Submit();

        Assert.Contains("Service unavailable", form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public async Task Submit_RetryAfterServerError_ClearsOldMessages_AndNavigates()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(ValidationProblem("""
            "FirstName":["First name is already taken."]
            """));
        form.Submit();
        Assert.NotEmpty(form.ValidationMessages);
        ApiService.ReturnsCreatedId(1);

        form.Submit();

        Assert.Empty(form.ValidationMessages);
        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public async Task Submit_ProblemDetailsWithoutErrors_ShowsDetailAsGeneralError_AndStaysOnPage()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(new ProblemDetailsException(
            """{"title":"Internal Server Error","status":500,"detail":"Database is unavailable."}""".ToProblemDetails()));

        form.Submit();

        Assert.Contains("Database is unavailable.", form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public async Task Submit_GatewayReturnsHtmlBody_ShowsStatusTitle_NotJsonParserError()
    {
        using var handler = new FakeHttpMessageHandler()
            .RespondBody(HttpStatusCode.BadGateway, "<html><body>502 Bad Gateway</body></html>", "text/html");
        Services.AddSingleton<IAddressBookApiService>(handler.CreateService());
        var form = await RenderFilledFormAsync();

        form.Submit();

        Assert.Equal(["Bad Gateway"], form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public async Task Submit_ProblemDetailsWithTitleOnly_ShowsTitleAsGeneralError()
    {
        var form = await RenderFilledFormAsync();
        ApiService.ThrowsOnCreate(new ProblemDetailsException(
            """{"title":"Bad Request","status":400}""".ToProblemDetails()));

        form.Submit();

        Assert.Contains("Bad Request", form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
    }
}
