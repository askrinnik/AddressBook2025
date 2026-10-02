namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Централизованные константы <c>data-testid</c> для AddressBook.Web — порт
/// <c>src/UiTests/src/utils/testids.ts</c>. Они зеркалят литералы в разметке Web
/// (MainLayout, NavMenu, Contacts, CreateContact, EditContact); при изменении любой из сторон
/// синхронизировать обе (расхождение ловит <c>TestIdsTests</c>).
/// Соглашение: kebab-case, иерархия <c>{area}-{control}</c>; контролы строки суффиксируются id.
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

    /// <summary>Деструктивная кнопка «Yes» в диалоге удаления (у «Cancel» видимый текст, ищется по имени).</summary>
    public const string ContactDeleteConfirm = "contact-delete-confirm";

    // Contact form, общая для CreateContact.razor и EditContact.razor
    public const string ContactFormFirstName = "contact-form-first-name";
    public const string ContactFormLastName = "contact-form-last-name";
    public const string ContactFormBirthday = "contact-form-birthday";

    /// <summary>Один id для submit-кнопок «Create» (создание) и «Save» (редактирование).</summary>
    public const string ContactFormSubmit = "contact-form-submit";
    public const string ContactFormCancel = "contact-form-cancel";

    // Контролы строки таблицы контактов (суффикс — id контакта).
    public static string ContactRow(int id) => $"contact-row-{id}";

    public static string ContactEditButton(int id) => $"contact-edit-{id}";

    public static string ContactDeleteButton(int id) => $"contact-delete-{id}";

    /// <summary>CSS-селектор по testid для <c>cut.Find(...)</c>: <c>[data-testid="..."]</c>.</summary>
    public static string Selector(string testId) => $"[data-testid=\"{testId}\"]";
}
