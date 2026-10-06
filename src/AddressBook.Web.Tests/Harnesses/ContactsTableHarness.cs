using System.Globalization;
using AddressBook.Web.Layout;
using AddressBook.Web.Pages;

namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Wrapper for the <c>Contacts</c> page (MudTable): rows, search, sorting, rows-per-page and
/// row actions. Table data loads asynchronously - after rendering, call
/// <see cref="WaitForLoaded"/>.
/// </summary>
public sealed class ContactsTableHarness(IRenderedComponent<Contacts> cut, IRenderedComponent<Error> errorHost)
{
    private const string RowPrefix = "contact-row-";

    /// <summary>
    /// Renders <c>Contacts</c> inside a real <see cref="Error"/> (the page requires it as a
    /// cascading parameter - it is invoked on a load error) and returns the harness. Providers
    /// (<c>RenderProviders()</c>) must be rendered before the call if the delete dialog is needed.
    /// </summary>
    public static ContactsTableHarness Render(BunitContext context)
    {
        var errorHost = context.Render<Error>(p => p.AddChildContent<Contacts>());
        return new ContactsTableHarness(errorHost.FindComponent<Contacts>(), errorHost);
    }

    /// <summary>Text of the top <see cref="Error"/> banner (what <c>ProcessError</c> showed), or <c>null</c>.</summary>
    public string? ErrorBannerText => errorHost.FindAll(".alert-danger .error-container").FirstOrDefault()?.TextContent.Trim();

    /// <summary>Contact ids in display order.</summary>
    public IReadOnlyList<int> RowIds =>
        cut.FindAll($"[data-testid^=\"{RowPrefix}\"]")
            .Select(e => int.Parse(e.GetAttribute("data-testid")![RowPrefix.Length..], CultureInfo.InvariantCulture))
            .ToList();

    public int RowCount => RowIds.Count;

    /// <summary>True when an empty-row text equals the empty-state message exactly (no surrounding quotes).</summary>
    public bool IsNoRecordsShown =>
        cut.FindAll(".mud-table-empty-row .mud-typography")
            .Any(e => e.TextContent.Trim() == "No matching records found");

    /// <summary>True when a text element of the table reads exactly "Loading..." (the <c>LoadingContent</c>).</summary>
    public bool IsLoading =>
        cut.FindAll(".mud-typography")
            .Any(e => e.TextContent.Trim() == "Loading...");

    /// <summary>Row cell text: First Name, Last Name, Birthday (as displayed in the table).</summary>
    public (string FirstName, string LastName, string Birthday) RowText(int id)
    {
        var cells = cut.FindByTestId(TestIds.ContactRow(id)).ParentElement!.Children;
        return (cells[0].TextContent.Trim(), cells[1].TextContent.Trim(), cells[2].TextContent.Trim());
    }

    /// <summary>Text of the load error alert (visible in <c>NoRecordsContent</c>), or <c>null</c>.</summary>
    public string? ErrorAlertText =>
        cut.FindAll(".mud-alert")
            .Select(a => a.TextContent.Trim())
            .FirstOrDefault(t => t.Length > 0);

    /// <summary>CSS classes of the load error alert; it carries <c>invisible</c> while there is no error.</summary>
    public string ErrorAlertClass => cut.Find(".mud-alert").ClassName ?? string.Empty;

    public string SearchText => cut.FindByTestId(TestIds.ContactsSearch).GetAttribute("value") ?? string.Empty;

    /// <summary>Typing into the search field (MudTextField commits the value on change) -> table reload.</summary>
    public void Search(string text) => cut.FindByTestId(TestIds.ContactsSearch).Change(text);

    public void ClickCreate() => cut.FindByTestId(TestIds.ContactsCreate).Click();

    public void ClickEdit(int id) => cut.FindByTestId(TestIds.ContactEditButton(id)).Click();

    /// <summary>Click on the row's Delete: opens the confirmation dialog (see <see cref="DeleteDialogHarness"/>).</summary>
    public void ClickDelete(int id) => cut.FindByTestId(TestIds.ContactDeleteButton(id)).Click();

    /// <summary>Click on a sortable column header ("First Name" / "Last Name" / "Birthday").</summary>
    public void SortBy(string columnLabel) =>
        cut.FindAll(".mud-table-sort-label")
            .Single(e => e.TextContent.Trim() == columnLabel)
            .Click();

    /// <summary>Current page size from the custom "Rows per page" selector.</summary>
    public int RowsPerPage =>
        int.Parse(cut.FindAll("[aria-label=\"Rows per page\"]").First().GetAttribute("value")!, CultureInfo.InvariantCulture);

    /// <summary>
    /// Selects the page size via <c>MudSelect&lt;int&gt;</c> (its dropdown is a popover, unreliable in bUnit,
    /// so the value is set via the component's own <c>ValueChanged</c>).
    /// </summary>
    public async Task SelectRowsPerPageAsync(int size)
    {
        var select = cut.FindComponent<MudSelect<int>>();
        await cut.InvokeAsync(() => select.Instance.ValueChanged.InvokeAsync(size));
    }

    /// <summary>Pager range text as displayed, for example "1-10 of 12".</summary>
    public string PagerInfo => cut.Find(".mud-table-page-number-information").TextContent.Trim();

    /// <summary>Click on the pager's "Next page" button; the new page loads asynchronously.</summary>
    public void NextPage() => cut.Find("button[aria-label=\"Next page\"]").Click();

    /// <summary>Click on the pager's "Previous page" button; the new page loads asynchronously.</summary>
    public void PreviousPage() => cut.Find("button[aria-label=\"Previous page\"]").Click();

    /// <summary>Waits until the initial/repeated table data load completes.</summary>
    public ContactsTableHarness WaitForLoaded()
    {
        cut.WaitForAssertion(() => Assert.False(IsLoading, "The table is still in the Loading state..."));
        return this;
    }
}
