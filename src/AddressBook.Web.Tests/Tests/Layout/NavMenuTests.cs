using AddressBook.Web.Layout;
using AngleSharp.Dom;
using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Tests.Layout;

public class NavMenuTests : MudTestContext
{
    private NavigationManager Navigation => Services.GetRequiredService<NavigationManager>();

    private static bool IsActive(IElement link) => link.ClassList.Contains("active");

    [Fact]
    public void Renders_HomeAndContactsLinks()
    {
        var cut = Render<NavMenu>();

        Assert.Equal(2, cut.FindAll("a.mud-nav-link").Count);
        Assert.Equal("Home", cut.FindByTestId(TestIds.NavHome).TextContent.Trim());
        Assert.Equal("Contacts", cut.FindByTestId(TestIds.NavContacts).TextContent.Trim());
    }

    [Fact]
    public void Links_HaveExpectedHrefs()
    {
        var cut = Render<NavMenu>();

        Assert.True(cut.FindByTestId(TestIds.NavHome).GetAttribute("href") is "" or "/");
        Assert.Equal("/contacts", cut.FindByTestId(TestIds.NavContacts).GetAttribute("href"));
    }

    [Fact]
    public void AtRoot_HomeIsActive_ContactsIsNot()
    {
        var cut = Render<NavMenu>();

        Assert.True(IsActive(cut.FindByTestId(TestIds.NavHome)));
        Assert.False(IsActive(cut.FindByTestId(TestIds.NavContacts)));
    }

    [Theory]
    [InlineData("/contacts")]
    [InlineData("/contacts/42")]
    public void OnContactsPath_ContactsIsActive_HomeIsNot(string path)
    {
        var cut = Render<NavMenu>();

        Navigation.NavigateTo(path);

        cut.WaitForAssertion(() =>
        {
            Assert.True(IsActive(cut.FindByTestId(TestIds.NavContacts)));
            Assert.False(IsActive(cut.FindByTestId(TestIds.NavHome)));
        });
    }

    [Fact]
    public void OnUnrelatedPath_NoLinkIsActive()
    {
        var cut = Render<NavMenu>();

        Navigation.NavigateTo("/create-contact");

        cut.WaitForAssertion(() =>
        {
            Assert.False(IsActive(cut.FindByTestId(TestIds.NavHome)));
            Assert.False(IsActive(cut.FindByTestId(TestIds.NavContacts)));
        });
    }

    [Fact]
    public void NavigatingBackToRoot_ReactivatesHome()
    {
        var cut = Render<NavMenu>();
        Navigation.NavigateTo("/contacts");
        cut.WaitForAssertion(() => Assert.True(IsActive(cut.FindByTestId(TestIds.NavContacts))));

        Navigation.NavigateTo("/");

        cut.WaitForAssertion(() =>
        {
            Assert.True(IsActive(cut.FindByTestId(TestIds.NavHome)));
            Assert.False(IsActive(cut.FindByTestId(TestIds.NavContacts)));
        });
    }
}
