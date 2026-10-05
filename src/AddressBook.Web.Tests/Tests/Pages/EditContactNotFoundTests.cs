using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Tests.Pages;

public class EditContactNotFoundTests : MudTestContext
{
    private const int MissingId = 404;

    private IRenderedComponent<EditContact> RenderPage()
    {
        ApiService.ReturnsContactNotFound(MissingId);
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo($"/edit-contact/{MissingId}");
        return Render<EditContact>(p => p.Add(x => x.Id, MissingId));
    }

    [Fact]
    public void Render_ContactNotFound_ShowsWarningAlert_AndBackButton()
    {
        var cut = RenderPage();

        var alert = cut.Find(".mud-alert");
        Assert.Equal("Contact not found.", alert.TextContent.Trim());
        Assert.Contains("mud-alert-text-warning", alert.ClassList);
        Assert.Contains(cut.FindAll("button"), b => b.TextContent.Trim() == "Back to Contacts");
    }

    [Fact]
    public void Render_ContactNotFound_DoesNotRenderForm()
    {
        var cut = RenderPage();

        Assert.Empty(cut.FindAll(TestIds.Selector(TestIds.ContactFormFirstName)));
        Assert.Empty(cut.FindAll(TestIds.Selector(TestIds.ContactFormSubmit)));
        ApiService.DidNotReceiveUpdate();
    }

    [Fact]
    public void BackToContacts_NavigatesToContacts()
    {
        var cut = RenderPage();

        cut.FindAll("button").Single(b => b.TextContent.Trim() == "Back to Contacts").Click();

        Assert.Equal("/contacts", CurrentPath);
    }
}
