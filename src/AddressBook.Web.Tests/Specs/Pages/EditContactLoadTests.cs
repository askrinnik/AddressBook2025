using AddressBook.Web.ErrorHandling;
using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Specs.Pages;

public class EditContactLoadTests : MudTestContext
{
    private const int ContactId = 7;

    private ContactFormHarness RenderPage()
    {
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo($"/edit-contact/{ContactId}");
        return new ContactFormHarness(Render<EditContact>(p => p.Add(x => x.Id, ContactId)));
    }

    [Fact]
    public void Render_ServerError_ShowsDetailInErrorAlert_AndBackButton()
    {
        ApiService.ThrowsOnGetContact(ContactId, new ProblemDetailsException(
            """{"title":"Internal Server Error","status":500,"detail":"Database is unavailable."}""".ToProblemDetails()));

        var page = RenderPage();

        Assert.Equal("Database is unavailable.", page.AlertText);
        Assert.Contains("mud-alert-text-error", page.AlertClasses);
        Assert.True(page.HasBackToContacts);
    }

    [Fact]
    public void Render_ServerErrorWithoutDetail_ShowsTitle()
    {
        ApiService.ThrowsOnGetContact(ContactId, new ProblemDetailsException(
            """{"title":"Bad Gateway","status":502}""".ToProblemDetails()));

        var page = RenderPage();

        Assert.Equal("Bad Gateway", page.AlertText);
    }

    [Fact]
    public void Render_NetworkError_ShowsGenericMessage_NotExceptionText()
    {
        ApiService.ThrowsOnGetContact(ContactId, new HttpRequestException("TypeError: Failed to fetch"));

        var page = RenderPage();

        Assert.Equal("Could not load the contact.", page.AlertText);
    }

    [Fact]
    public void Render_ProblemDetailsWithoutBody_ShowsGenericMessage()
    {
        ApiService.ThrowsOnGetContact(ContactId, new ProblemDetailsException(null));

        var page = RenderPage();

        Assert.Equal("Could not load the contact.", page.AlertText);
    }

    [Fact]
    public void Render_LoadError_DoesNotRenderForm_AndDoesNotUpdate()
    {
        ApiService.ThrowsOnGetContact(ContactId, new HttpRequestException("Network down"));

        var page = RenderPage();

        Assert.False(page.IsFormShown);
        Assert.False(page.IsProgressShown);
        ApiService.DidNotReceiveUpdate();
    }

    [Fact]
    public void BackToContacts_AfterLoadError_NavigatesToContacts()
    {
        ApiService.ThrowsOnGetContact(ContactId, new HttpRequestException("Network down"));
        var page = RenderPage();

        page.BackToContacts();

        Assert.Equal("/contacts", CurrentPath);
    }

    [Fact]
    public void Render_WhileLoading_ShowsProgressIndicator_AndNoForm()
    {
        ApiService.HoldsContactRequest(ContactId);

        var page = RenderPage();

        Assert.True(page.IsProgressShown);
        Assert.False(page.IsFormShown);
        Assert.Null(page.AlertText);
    }

    [Fact]
    public void Render_LoadCompletes_HidesIndicator_AndPrefillsForm()
    {
        var contact = ContactBuilder.Existing.Valid(ContactId);
        var pending = ApiService.HoldsContactRequest(ContactId);
        var form = RenderPage();

        pending.SetResult(contact);

        form.WaitForFormShown();
        Assert.False(form.IsProgressShown);
        Assert.Equal(contact.FirstName, form.FirstName);
        Assert.Equal(contact.LastName, form.LastName);
    }
}
