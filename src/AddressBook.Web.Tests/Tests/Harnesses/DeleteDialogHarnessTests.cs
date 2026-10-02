using AddressBook.Contracts.Models;

namespace AddressBook.Web.Tests.Tests.Harnesses;

public class DeleteDialogHarnessTests : MudTestContext
{
    private (ContactsTableHarness Table, DeleteDialogHarness Dialog, ContactModel Contact) Arrange()
    {
        var contact = ContactBuilder.Existing.Valid();
        ApiService.ReturnsContacts(contact);
        var (_, dialogProvider) = RenderProviders();
        var table = ContactsTableHarness.Render(this).WaitForLoaded();
        return (table, new DeleteDialogHarness(dialogProvider), contact);
    }

    [Fact]
    public void Dialog_IsClosedUntilDeleteClicked()
    {
        var (_, dialog, _) = Arrange();

        Assert.False(dialog.IsOpen);
    }

    [Fact]
    public void ClickDelete_OpensDialogWithWarningAndMessage()
    {
        var (table, dialog, contact) = Arrange();

        table.ClickDelete(contact.Id);

        Assert.True(dialog.IsOpen);
        Assert.Equal("Warning", dialog.Title);
        Assert.Contains("Are you sure you want to delete this contact?", dialog.Message);
    }

    [Fact]
    public void Cancel_ClosesDialogWithoutDeleting()
    {
        var (table, dialog, contact) = Arrange();
        table.ClickDelete(contact.Id);

        dialog.Cancel();

        ApiService.DidNotReceiveDelete();
        Assert.False(dialog.IsOpen);
    }

    [Fact]
    public void Confirm_DeletesContactAndReloadsTable()
    {
        var (table, dialog, contact) = Arrange();
        table.ClickDelete(contact.Id);

        dialog.Confirm();

        ApiService.ReceivedDelete(contact.Id);
        ApiService.ReceivedSearch(string.Empty, 2);
        Assert.False(dialog.IsOpen);
    }
}
