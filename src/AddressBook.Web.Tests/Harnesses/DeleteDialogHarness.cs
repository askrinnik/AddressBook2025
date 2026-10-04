namespace AddressBook.Web.Tests.Harnesses;

/// <summary>
/// Wrapper for the delete confirmation dialog (<c>MudMessageBox</c>). The dialog is opened via
/// <c>IDialogService</c> and rendered in <see cref="MudDialogProvider"/>, so the harness is built
/// on the provider (see <c>MudTestContext.RenderProviders()</c>), not on the page.
/// </summary>
public sealed class DeleteDialogHarness(IRenderedComponent<MudDialogProvider> provider)
{
    public bool IsOpen => provider.FindAll(".mud-dialog").Count > 0;

    public string Title => provider.Find(".mud-dialog-title").TextContent.Trim();

    public string Message => provider.Find(".mud-dialog-content").TextContent.Trim();

    /// <summary>The "Yes" button (by <c>data-testid</c>) - confirms the deletion.</summary>
    public void Confirm() => provider.FindByTestId(TestIds.ContactDeleteConfirm).Click();

    /// <summary>The "Cancel" button (visible text, no testid) - cancels the deletion.</summary>
    public void Cancel() =>
        provider.FindAll(".mud-dialog-actions button")
            .Single(b => b.TextContent.Trim() == "Cancel")
            .Click();
}
