namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Centralized <c>data-testid</c> constants for AddressBook.Web - a port of
/// <c>src/UiTests/src/utils/testids.ts</c>. They mirror the literals in the Web markup
/// (MainLayout, NavMenu, Contacts, CreateContact, EditContact); when either side changes,
/// keep both in sync (a mismatch is caught by <c>TestIdsTests</c>).
/// Convention: kebab-case, hierarchy <c>{area}-{control}</c>; row controls are suffixed with the id.
/// </summary>
public static class TestIds
{
    // App shell (MainLayout / NavMenu)
    public const string DrawerToggle = "app-drawer-toggle";
    public const string ThemeToggle = "app-theme-toggle";
    public const string NavHome = "nav-home";
    public const string NavContacts = "nav-contacts";

    // Contacts page (Contacts.razor)
    public const string ContactsCreate = "contacts-create";
    public const string ContactsSearch = "contacts-search";
    public const string ContactsTable = "contacts-table";

    /// <summary>The destructive "Yes" button in the delete dialog ("Cancel" has visible text and is found by name).</summary>
    public const string ContactDeleteConfirm = "contact-delete-confirm";

    // Contact form, shared by CreateContact.razor and EditContact.razor
    public const string ContactFormFirstName = "contact-form-first-name";
    public const string ContactFormLastName = "contact-form-last-name";
    public const string ContactFormBirthday = "contact-form-birthday";

    /// <summary>One id for the submit buttons "Create" (create) and "Save" (edit).</summary>
    public const string ContactFormSubmit = "contact-form-submit";
    public const string ContactFormCancel = "contact-form-cancel";

    // Contacts table row controls (the suffix is the contact id).
    public static string ContactRow(int id) => $"contact-row-{id}";

    public static string ContactEditButton(int id) => $"contact-edit-{id}";

    public static string ContactDeleteButton(int id) => $"contact-delete-{id}";

    /// <summary>CSS selector by testid for <c>cut.Find(...)</c>: <c>[data-testid="..."]</c>.</summary>
    public static string Selector(string testId) => $"[data-testid=\"{testId}\"]";
}
