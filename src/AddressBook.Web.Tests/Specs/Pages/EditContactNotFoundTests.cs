using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Specs.Pages;

public class EditContactNotFoundTests : MudTestContext
{
    private const int MissingId = 404;

    private ContactFormHarness RenderPage()
    {
        ApiService.ReturnsContactNotFound(MissingId);
        RenderProviders();
        Services.GetRequiredService<NavigationManager>().NavigateTo($"/edit-contact/{MissingId}");
        return new ContactFormHarness(Render<EditContact>(p => p.Add(x => x.Id, MissingId)));
    }

    [Fact]
    public void Render_ContactNotFound_ShowsWarningAlert_AndBackButton()
    {
        var page = RenderPage();

        Assert.Equal("Contact not found.", page.AlertText);
        Assert.Contains("mud-alert-text-warning", page.AlertClasses);
        Assert.True(page.HasBackToContacts);
    }

    [Fact]
    public void Render_ContactNotFound_DoesNotRenderForm()
    {
        var page = RenderPage();

        Assert.False(page.IsFormShown);
        ApiService.DidNotReceiveUpdate();
    }

    [Fact]
    public void BackToContacts_NavigatesToContacts()
    {
        var page = RenderPage();

        page.BackToContacts();

        Assert.Equal("/contacts", CurrentPath);
    }
}
