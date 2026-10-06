using AddressBook.Contracts.Models;
using AddressBook.Web.ErrorHandling;

namespace AddressBook.Web.Tests.Tests.Pages;

public class ContactsDeleteTests : MudTestContext
{
    private (ContactsTableHarness Table, DeleteDialogHarness Dialog, IReadOnlyList<ContactModel> Contacts) Arrange()
    {
        var contacts = ContactBuilder.Existing.List(3);
        ApiService.ReturnsContacts(contacts.ToArray());
        var (_, dialogProvider) = RenderProviders();
        var table = ContactsTableHarness.Render(this).WaitForLoaded();
        return (table, new DeleteDialogHarness(dialogProvider), contacts);
    }

    [Fact]
    public void ClickDelete_OpensConfirmationDialog_WithoutDeleting()
    {
        var (table, dialog, contacts) = Arrange();

        table.ClickDelete(contacts[0].Id);

        Assert.True(dialog.IsOpen);
        ApiService.DidNotReceiveDelete();
    }

    [Fact]
    public void Cancel_DoesNotDeleteOrReload_AndKeepsRows()
    {
        var (table, dialog, contacts) = Arrange();
        table.ClickDelete(contacts[0].Id);

        dialog.Cancel();

        ApiService.DidNotReceiveDelete();
        ApiService.ReceivedSearch(string.Empty);
        Assert.False(dialog.IsOpen);
        Assert.Equal(contacts.Select(c => c.Id), table.RowIds);
    }

    [Fact]
    public void Confirm_DeletesClickedContact_AndReloadsTable()
    {
        var (table, dialog, contacts) = Arrange();
        var target = contacts[1];
        var remaining = contacts.Where(c => c.Id != target.Id).ToArray();
        table.ClickDelete(target.Id);
        ApiService.ReturnsContacts(remaining);

        dialog.Confirm();

        table.WaitForLoaded();
        ApiService.ReceivedDelete(target.Id);
        ApiService.ReceivedSearch(string.Empty, times: 2);
        Assert.False(dialog.IsOpen);
        Assert.Equal(remaining.Select(c => c.Id), table.RowIds);
    }

    [Fact]
    public void Confirm_ServerError_ShowsDetailInBanner_AndKeepsTableUsable()
    {
        var (table, dialog, contacts) = Arrange();
        ApiService.ThrowsOnDelete(new ProblemDetailsException(
            """{"title":"Internal Server Error","status":500,"detail":"Database is unavailable."}""".ToProblemDetails()));
        table.ClickDelete(contacts[0].Id);

        dialog.Confirm();

        table.WaitForLoaded();
        Assert.Equal("Database is unavailable.", table.ErrorBannerText);
        Assert.False(dialog.IsOpen);
        Assert.Equal(contacts.Select(c => c.Id), table.RowIds);
    }

    [Fact]
    public void Confirm_NetworkError_ShowsExceptionMessageInBanner()
    {
        var (table, dialog, contacts) = Arrange();
        ApiService.ThrowsOnDelete(new HttpRequestException("Connection refused"));
        table.ClickDelete(contacts[0].Id);

        dialog.Confirm();

        table.WaitForLoaded();
        Assert.Equal("Connection refused", table.ErrorBannerText);
        Assert.Equal(contacts.Select(c => c.Id), table.RowIds);
    }

    [Fact]
    public void Confirm_NotFound_ReloadsTableWithoutError()
    {
        var (table, dialog, contacts) = Arrange();
        var target = contacts[0];
        var remaining = contacts.Where(c => c.Id != target.Id).ToArray();
        ApiService.ThrowsOnDelete(new ProblemDetailsException(
            """{"title":"Not Found","status":404}""".ToProblemDetails()));
        table.ClickDelete(target.Id);
        ApiService.ReturnsContacts(remaining);

        dialog.Confirm();

        table.WaitForLoaded();
        Assert.Null(table.ErrorBannerText);
        ApiService.ReceivedSearch(string.Empty, times: 2);
        Assert.Equal(remaining.Select(c => c.Id), table.RowIds);
    }

    [Fact]
    public void Confirm_AfterFailedDelete_NextDeleteSucceeds()
    {
        var (table, dialog, contacts) = Arrange();
        ApiService.ThrowsOnDelete(new HttpRequestException("Connection refused"));
        table.ClickDelete(contacts[0].Id);
        dialog.Confirm();
        table.WaitForLoaded();
        var remaining = contacts.Where(c => c.Id != contacts[1].Id).ToArray();
        ApiService.DeleteContact(Arg.Any<int>()).Returns(Task.CompletedTask);
        ApiService.ReturnsContacts(remaining);
        table.ClickDelete(contacts[1].Id);

        dialog.Confirm();

        table.WaitForLoaded();
        ApiService.ReceivedDelete(contacts[1].Id);
        Assert.Equal(remaining.Select(c => c.Id), table.RowIds);
    }
}
