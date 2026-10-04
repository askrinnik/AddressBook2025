using AddressBook.Web.ErrorHandling;
using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Tests.Pages;

public class CreateContactServerErrorTests : MudTestContext
{
    private const string InitialPath = "/create-contact";

    private ContactFormHarness RenderFilledForm()
    {
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo(InitialPath);
        var form = new ContactFormHarness(Render<CreateContact>());
        return form.Fill(ContactBuilder.New.Valid());
    }

    private static ProblemDetailsException ValidationProblem(string errorsJson) =>
        new(("{\"title\":\"One or more validation errors occurred.\",\"status\":400,\"errors\":{" + errorsJson + "}}").ToProblemDetails());

    [Fact]
    public void Submit_ServerReturnsFieldError_ShowsMessageOnThatField_AndStaysOnPage()
    {
        var form = RenderFilledForm();
        ApiService.ThrowsOnCreate(ValidationProblem("""
            "FirstName":["First name is already taken."]
            """));

        form.Submit();

        Assert.Contains("First name is already taken.", form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
    }

    [Fact]
    public void Submit_ServerReturnsErrorsForSeveralFields_ShowsMessageOnEachField()
    {
        var form = RenderFilledForm();
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
    public void Submit_ServerReturnsError_EnablesSubmitButtonAgain()
    {
        var form = RenderFilledForm();
        ApiService.ThrowsOnCreate(ValidationProblem("""
            "LastName":["Last name is too long."]
            """));

        form.Submit();

        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public void Submit_ProblemDetailsWithoutBody_ShowsNoMessages_AndStaysOnPage()
    {
        var form = RenderFilledForm();
        ApiService.ThrowsOnCreate(new ProblemDetailsException(null));

        form.Submit();

        Assert.Empty(form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public void Submit_UnexpectedException_ShowsItsMessageAsGeneralError_AndStaysOnPage()
    {
        var form = RenderFilledForm();
        ApiService.ThrowsOnCreate(new HttpRequestException("Service unavailable"));

        form.Submit();

        Assert.Contains("Service unavailable", form.ValidationMessages);
        Assert.Equal(InitialPath, CurrentPath);
        Assert.False(form.IsSubmitDisabled);
    }

    [Fact]
    public void Submit_RetryAfterServerError_ClearsOldMessages_AndNavigates()
    {
        var form = RenderFilledForm();
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
}
