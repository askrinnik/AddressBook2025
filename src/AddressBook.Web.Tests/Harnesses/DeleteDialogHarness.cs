namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Обёртка диалога подтверждения удаления (<c>MudMessageBox</c>). Диалог открывается через
/// <c>IDialogService</c> и рендерится в <see cref="MudDialogProvider"/>, поэтому harness строится
/// на провайдере (см. <c>MudTestContext.RenderProviders()</c>), а не на странице.
/// </summary>
public sealed class DeleteDialogHarness(IRenderedComponent<MudDialogProvider> provider)
{
    public bool IsOpen => provider.FindAll(".mud-dialog").Count > 0;

    public string Title => provider.Find(".mud-dialog-title").TextContent.Trim();

    public string Message => provider.Find(".mud-dialog-content").TextContent.Trim();

    /// <summary>Кнопка «Yes» (по <c>data-testid</c>) — подтвердить удаление.</summary>
    public void Confirm() => provider.FindByTestId(TestIds.ContactDeleteConfirm).Click();

    /// <summary>Кнопка «Cancel» (видимый текст, testid нет) — отменить удаление.</summary>
    public void Cancel() =>
        provider.FindAll(".mud-dialog-actions button")
            .Single(b => b.TextContent.Trim() == "Cancel")
            .Click();
}
