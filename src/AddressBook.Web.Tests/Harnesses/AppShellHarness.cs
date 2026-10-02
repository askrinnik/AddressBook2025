using AddressBook.Web.Layout;

namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Обёртка оболочки приложения (<c>MainLayout</c> + <c>NavMenu</c>): заголовок AppBar, drawer,
/// тумблер темы и навигационные ссылки.
/// </summary>
public sealed class AppShellHarness(IRenderedComponent<MainLayout> cut)
{
    public string Title => cut.Find(".mud-appbar .mud-typography-h5").TextContent.Trim();

    public bool IsDrawerOpen => cut.Find("#nav-drawer").ClassList.Contains("mud-drawer--open");

    public void ToggleDrawer() => cut.FindByTestId(TestIds.DrawerToggle).Click();

    /// <summary>Тема определяется по иконке тумблера (<c>MainLayout.DarkLightModeButtonIcon</c>): AutoMode ⇒ dark.</summary>
    public bool IsDarkMode => cut.Instance.DarkLightModeButtonIcon == Icons.Material.Rounded.AutoMode;

    public void ToggleTheme() => cut.FindByTestId(TestIds.ThemeToggle).Click();

    public string NavHomeHref => cut.FindByTestId(TestIds.NavHome).GetAttribute("href") ?? string.Empty;

    public string NavContactsHref => cut.FindByTestId(TestIds.NavContacts).GetAttribute("href") ?? string.Empty;

    public bool IsNavHomeActive => cut.FindByTestId(TestIds.NavHome).ClassList.Contains("active");

    public bool IsNavContactsActive => cut.FindByTestId(TestIds.NavContacts).ClassList.Contains("active");
}
