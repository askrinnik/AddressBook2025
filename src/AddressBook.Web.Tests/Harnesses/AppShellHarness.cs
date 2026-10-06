using AddressBook.Web.Layout;

namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Wrapper for the app shell (<c>MainLayout</c> + <c>NavMenu</c>): AppBar title, drawer,
/// and theme toggle.
/// </summary>
public sealed class AppShellHarness(IRenderedComponent<MainLayout> cut)
{
    public string Title => cut.Find(".mud-appbar .mud-typography-h5").TextContent.Trim();

    public bool IsDrawerOpen => cut.Find("#nav-drawer").ClassList.Contains("mud-drawer--open");

    public void ToggleDrawer() => cut.FindByTestId(TestIds.DrawerToggle).Click();

    /// <summary>The theme is determined by the toggle icon (<c>MainLayout.DarkLightModeButtonIcon</c>): AutoMode => dark.</summary>
    public bool IsDarkMode => cut.Instance.DarkLightModeButtonIcon == Icons.Material.Rounded.AutoMode;

    public void ToggleTheme() => cut.FindByTestId(TestIds.ThemeToggle).Click();
}
