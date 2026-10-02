using System.Globalization;
using AddressBook.Web.Layout;
using AddressBook.Web.Pages;

namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Обёртка страницы <c>Contacts</c> (MudTable): строки, поиск, сортировка, rows-per-page и
/// действия строки. Данные таблицы грузятся асинхронно — после рендера вызывайте
/// <see cref="WaitForLoaded"/>.
/// </summary>
public sealed class ContactsTableHarness(IRenderedComponent<Contacts> cut, IRenderedComponent<Error> errorHost)
{
    private const string RowPrefix = "contact-row-";

    /// <summary>
    /// Рендерит <c>Contacts</c> внутри реального <see cref="Error"/> (страница требует его как
    /// cascading-параметр — при ошибке загрузки он вызывается) и возвращает harness. Провайдеры
    /// (<c>RenderProviders()</c>) нужно отрендерить до вызова, если нужен диалог удаления.
    /// </summary>
    public static ContactsTableHarness Render(BunitContext context)
    {
        var errorHost = context.Render<Error>(p => p.AddChildContent<Contacts>());
        return new ContactsTableHarness(errorHost.FindComponent<Contacts>(), errorHost);
    }

    /// <summary>Текст верхнего баннера <see cref="Error"/> (то, что показал <c>ProcessError</c>), либо <c>null</c>.</summary>
    public string? ErrorBannerText => errorHost.FindAll(".alert-danger .error-container").FirstOrDefault()?.TextContent.Trim();

    /// <summary>Id контактов в порядке отображения.</summary>
    public IReadOnlyList<int> RowIds =>
        cut.FindAll($"[data-testid^=\"{RowPrefix}\"]")
            .Select(e => int.Parse(e.GetAttribute("data-testid")![RowPrefix.Length..], CultureInfo.InvariantCulture))
            .ToList();

    public int RowCount => RowIds.Count;

    public bool IsNoRecordsShown => cut.Markup.Contains("No matching records found", StringComparison.Ordinal);

    public bool IsLoading => cut.Markup.Contains("Loading...", StringComparison.Ordinal);

    /// <summary>Текст ячеек строки: First Name, Last Name, Birthday (как отображены в таблице).</summary>
    public (string FirstName, string LastName, string Birthday) RowText(int id)
    {
        var cells = cut.FindByTestId(TestIds.ContactRow(id)).ParentElement!.Children;
        return (cells[0].TextContent.Trim(), cells[1].TextContent.Trim(), cells[2].TextContent.Trim());
    }

    /// <summary>Текст алерта ошибки загрузки (виден в <c>NoRecordsContent</c>), либо <c>null</c>.</summary>
    public string? ErrorAlertText =>
        cut.FindAll(".mud-alert")
            .Select(a => a.TextContent.Trim())
            .FirstOrDefault(t => t.Length > 0);

    public string SearchText => cut.FindByTestId(TestIds.ContactsSearch).GetAttribute("value") ?? string.Empty;

    /// <summary>Ввод в поле поиска (MudTextField коммитит значение по change) → перезагрузка таблицы.</summary>
    public void Search(string text) => cut.FindByTestId(TestIds.ContactsSearch).Change(text);

    public void ClickCreate() => cut.FindByTestId(TestIds.ContactsCreate).Click();

    public void ClickEdit(int id) => cut.FindByTestId(TestIds.ContactEditButton(id)).Click();

    /// <summary>Клик по Delete строки: открывает диалог подтверждения (см. <see cref="DeleteDialogHarness"/>).</summary>
    public void ClickDelete(int id) => cut.FindByTestId(TestIds.ContactDeleteButton(id)).Click();

    /// <summary>Клик по заголовку сортируемой колонки («First Name» / «Last Name» / «Birthday»).</summary>
    public void SortBy(string columnLabel) =>
        cut.FindAll(".mud-table-sort-label")
            .Single(e => e.TextContent.Trim() == columnLabel)
            .Click();

    /// <summary>Текущий размер страницы из кастомного селектора «Rows per page».</summary>
    public int RowsPerPage =>
        int.Parse(cut.FindAll("[aria-label=\"Rows per page\"]").First().GetAttribute("value")!, CultureInfo.InvariantCulture);

    /// <summary>
    /// Выбор размера страницы через <c>MudSelect&lt;int&gt;</c> (его выпадашка — popover, ненадёжный в bUnit,
    /// поэтому значение задаётся через <c>ValueChanged</c> самого компонента).
    /// </summary>
    public void SelectRowsPerPage(int size)
    {
        var select = cut.FindComponent<MudSelect<int>>();
        cut.InvokeAsync(() => select.Instance.ValueChanged.InvokeAsync(size)).GetAwaiter().GetResult();
    }

    /// <summary>Ждёт, пока завершится начальная/повторная загрузка данных таблицы.</summary>
    public ContactsTableHarness WaitForLoaded()
    {
        cut.WaitForAssertion(() => Assert.False(IsLoading, "Таблица всё ещё в состоянии Loading..."));
        return this;
    }
}
