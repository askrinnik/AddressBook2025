using AddressBook.Web.Layout;
using MudBlazor.Extensions;

namespace AddressBook.Web.Tests.Tests.Layout;

public class MainLayoutTests : MudTestContext
{
    // Desktop viewport: the responsive MudDrawer is open, as in a browser on a wide screen.
    public MainLayoutTests() => JSInterop.SetupBrowserWindowSize(1920, 1080);

    private IRenderedComponent<MainLayout> RenderLayout() =>
        Render<MainLayout>(p => p.Add(l => l.Body, b => b.AddMarkupContent(0, "<p id=\"page-body\">body</p>")));

    [Fact]
    public void Renders_MudBlazorProviders()
    {
        var cut = RenderLayout();

        Assert.Single(cut.FindComponents<MudThemeProvider>());
        Assert.Single(cut.FindComponents<MudPopoverProvider>());
        Assert.Single(cut.FindComponents<MudDialogProvider>());
        Assert.Single(cut.FindComponents<MudSnackbarProvider>());
    }

    [Fact]
    public void Renders_BodyInsideMainContent()
    {
        var cut = RenderLayout();

        var body = cut.FindComponent<MudMainContent>().Find("#page-body");
        Assert.Equal("body", body.TextContent);
    }

    [Fact]
    public void Drawer_HostsNavMenu()
    {
        var cut = RenderLayout();

        var drawer = cut.FindComponent<MudDrawer>();
        Assert.Single(drawer.FindComponents<NavMenu>());
    }

    [Fact]
    public void Title_IsContactBook() =>
        Assert.Equal("Contact Book", new AppShellHarness(RenderLayout()).Title);

    [Fact]
    public void AppBarButtons_HaveAccessibleNames()
    {
        var cut = RenderLayout();

        Assert.Equal(TestIds.DrawerToggle, cut.FindByAriaLabel("Toggle navigation drawer").GetAttribute("data-testid"));
        Assert.Equal(TestIds.ThemeToggle, cut.FindByAriaLabel("Toggle dark/light mode").GetAttribute("data-testid"));
    }

    [Fact]
    public void Drawer_IsOpenByDefault() =>
        Assert.True(new AppShellHarness(RenderLayout()).IsDrawerOpen);

    [Fact]
    public void Drawer_IsClosedByDefaultOnMobileViewport()
    {
        JSInterop.SetupBrowserWindowSize(375, 812);

        Assert.False(new AppShellHarness(RenderLayout()).IsDrawerOpen);
    }

    [Fact]
    public void DrawerToggle_ClosesAndReopensDrawer()
    {
        var shell = new AppShellHarness(RenderLayout());

        shell.ToggleDrawer();
        Assert.False(shell.IsDrawerOpen);

        shell.ToggleDrawer();
        Assert.True(shell.IsDrawerOpen);
    }

    [Fact]
    public void Theme_IsLightByDefault()
    {
        var cut = RenderLayout();
        var shell = new AppShellHarness(cut);

        Assert.False(shell.IsDarkMode);
        Assert.False(cut.FindComponent<MudThemeProvider>().Instance.GetState(x => x.IsDarkMode));
        Assert.Equal(Icons.Material.Outlined.DarkMode, cut.Instance.DarkLightModeButtonIcon);
    }

    [Fact]
    public void ThemeToggle_SwitchesToDarkAndBackToLight()
    {
        var cut = RenderLayout();
        var shell = new AppShellHarness(cut);
        var themeProvider = cut.FindComponent<MudThemeProvider>();

        shell.ToggleTheme();
        Assert.True(shell.IsDarkMode);
        Assert.True(themeProvider.Instance.GetState(x => x.IsDarkMode));
        Assert.Equal(Icons.Material.Rounded.AutoMode, cut.Instance.DarkLightModeButtonIcon);

        shell.ToggleTheme();
        Assert.False(shell.IsDarkMode);
        Assert.False(themeProvider.Instance.GetState(x => x.IsDarkMode));
        Assert.Equal(Icons.Material.Outlined.DarkMode, cut.Instance.DarkLightModeButtonIcon);
    }

    [Fact]
    public void ThemeToggle_DoesNotAffectDrawer()
    {
        var shell = new AppShellHarness(RenderLayout());

        shell.ToggleTheme();

        Assert.True(shell.IsDrawerOpen);
    }
}
