using AddressBook.Web.Layout;

namespace AddressBook.Web.Tests.Tests.Harnesses;

public class AppShellHarnessTests : MudTestContext
{
    private AppShellHarness RenderShell()
    {
        var cut = Render<MainLayout>(p => p.Add(l => l.Body, b => b.AddMarkupContent(0, "<p>body</p>")));
        return new AppShellHarness(cut);
    }
    [Fact]
    public void Title_IsContactBook() =>
        Assert.Equal("Contact Book", RenderShell().Title);
    [Fact]
    public void ToggleDrawer_FlipsOpenState()
    {
        var shell = RenderShell();
        var initial = shell.IsDrawerOpen;

        shell.ToggleDrawer();

        Assert.NotEqual(initial, shell.IsDrawerOpen);
    }
    [Fact]
    public void ToggleTheme_FlipsDarkMode()
    {
        var shell = RenderShell();
        Assert.False(shell.IsDarkMode);

        shell.ToggleTheme();
        Assert.True(shell.IsDarkMode);

        shell.ToggleTheme();
        Assert.False(shell.IsDarkMode);
    }
    [Fact]
    public void NavLinks_HaveExpectedHrefs()
    {
        var shell = RenderShell();

        Assert.True(shell.NavHomeHref is "" or "/");
        Assert.Equal("/contacts", shell.NavContactsHref);
    }

    [Fact]
    public void ActiveNavLink_FollowsCurrentUri()
    {
        var shell = RenderShell();

        Assert.True(shell.IsNavHomeActive);
        Assert.False(shell.IsNavContactsActive);
    }
}
