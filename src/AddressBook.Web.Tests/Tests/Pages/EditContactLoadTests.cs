using AddressBook.Web.ErrorHandling;
using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Tests.Pages;

public class EditContactLoadTests : MudTestContext
{
    private const int ContactId = 7;

    private IRenderedComponent<EditContact> RenderPage()
    {
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo($"/edit-contact/{ContactId}");
        return Render<EditContact>(p => p.Add(x => x.Id, ContactId));
    }

    private static bool HasForm(IRenderedComponent<EditContact> cut) =>
        cut.FindAll(TestIds.Selector(TestIds.ContactFormFirstName)).Count > 0
        || cut.FindAll(TestIds.Selector(TestIds.ContactFormSubmit)).Count > 0;

    [Fact]
    public void Render_ServerError_ShowsDetailInErrorAlert_AndBackButton()
    {
        ApiService.ThrowsOnGetContact(ContactId, new ProblemDetailsException(
            """{"title":"Internal Server Error","status":500,"detail":"Database is unavailable."}""".ToProblemDetails()));

        var cut = RenderPage();

        var alert = cut.Find(".mud-alert");
        Assert.Equal("Database is unavailable.", alert.TextContent.Trim());
        Assert.Contains("mud-alert-text-error", alert.ClassList);
        Assert.Contains(cut.FindAll("button"), b => b.TextContent.Trim() == "Back to Contacts");
    }

    [Fact]
    public void Render_ServerErrorWithoutDetail_ShowsTitle()
    {
        ApiService.ThrowsOnGetContact(ContactId, new ProblemDetailsException(
            """{"title":"Bad Gateway","status":502}""".ToProblemDetails()));

        var cut = RenderPage();

        Assert.Equal("Bad Gateway", cut.Find(".mud-alert").TextContent.Trim());
    }

    [Fact]
    public void Render_NetworkError_ShowsGenericMessage_NotExceptionText()
    {
        ApiService.ThrowsOnGetContact(ContactId, new HttpRequestException("TypeError: Failed to fetch"));

        var cut = RenderPage();

        Assert.Equal("Could not load the contact.", cut.Find(".mud-alert").TextContent.Trim());
    }

    [Fact]
    public void Render_ProblemDetailsWithoutBody_ShowsGenericMessage()
    {
        ApiService.ThrowsOnGetContact(ContactId, new ProblemDetailsException(null));

        var cut = RenderPage();

        Assert.Equal("Could not load the contact.", cut.Find(".mud-alert").TextContent.Trim());
    }

    [Fact]
    public void Render_LoadError_DoesNotRenderForm_AndDoesNotUpdate()
    {
        ApiService.ThrowsOnGetContact(ContactId, new HttpRequestException("Network down"));

        var cut = RenderPage();

        Assert.False(HasForm(cut));
        Assert.Empty(cut.FindAll("[role=progressbar]"));
        ApiService.DidNotReceiveUpdate();
    }

    [Fact]
    public void BackToContacts_AfterLoadError_NavigatesToContacts()
    {
        ApiService.ThrowsOnGetContact(ContactId, new HttpRequestException("Network down"));
        var cut = RenderPage();

        cut.FindAll("button").Single(b => b.TextContent.Trim() == "Back to Contacts").Click();

        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Render_WhileLoading_ShowsProgressIndicator_AndNoForm()
    {
        ApiService.HoldsContactRequest(ContactId);

        var cut = RenderPage();

        Assert.Single(cut.FindAll("[role=progressbar]"));
        Assert.False(HasForm(cut));
        Assert.Empty(cut.FindAll(".mud-alert"));
    }

    [Fact]
    public void Render_LoadCompletes_HidesIndicator_AndPrefillsForm()
    {
        var contact = ContactBuilder.Existing.Valid(ContactId);
        var pending = ApiService.HoldsContactRequest(ContactId);
        var cut = RenderPage();

        pending.SetResult(contact);

        cut.WaitForState(() => HasForm(cut));
        Assert.Empty(cut.FindAll("[role=progressbar]"));
        var form = new ContactFormHarness(cut);
        Assert.Equal(contact.FirstName, form.FirstName);
        Assert.Equal(contact.LastName, form.LastName);
    }
}
