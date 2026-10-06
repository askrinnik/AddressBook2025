namespace AddressBook.Web.Tests.Specs.Harnesses;

public class ContactsTableHarnessTests : MudTestContext
{
    private ContactsTableHarness RenderTable()
    {
        RenderProviders();
        return ContactsTableHarness.Render(this).WaitForLoaded();
    }

    [Fact]
    public void Rows_AreReadInDisplayOrder()
    {
        var contacts = ContactBuilder.Existing.List(3);
        ApiService.ReturnsContacts(contacts.ToArray());

        var table = RenderTable();

        Assert.Equal(contacts.Select(c => c.Id), table.RowIds);
        Assert.Equal(3, table.RowCount);
        Assert.False(table.IsNoRecordsShown);
    }

    [Fact]
    public void RowText_ReturnsNamesAndBirthday()
    {
        var contact = ContactBuilder.Existing.Valid();
        ApiService.ReturnsContacts(contact);

        var (first, last, birthday) = RenderTable().RowText(contact.Id);

        Assert.Equal(contact.FirstName, first);
        Assert.Equal(contact.LastName, last);
        Assert.Equal(contact.Birthday?.ToShortDateString(), birthday);
    }

    [Fact]
    public void EmptyResult_ShowsNoRecords()
    {
        ApiService.ReturnsContacts();

        var table = RenderTable();

        Assert.True(table.IsNoRecordsShown);
        Assert.Equal(0, table.RowCount);
    }

    [Fact]
    public void Search_RequestsContactsWithTerm()
    {
        var found = ContactBuilder.Existing.Valid();
        ApiService.ReturnsContacts(ContactBuilder.Existing.List(2).ToArray());
        ApiService.ReturnsContactsFor("abc", found);
        var table = RenderTable();

        table.Search("abc");

        ApiService.ReceivedSearch("abc");
        Assert.Equal([found.Id], table.RowIds);
    }

    [Fact]
    public void ClickEdit_NavigatesToEditPage()
    {
        var contact = ContactBuilder.Existing.Valid();
        ApiService.ReturnsContacts(contact);
        var table = RenderTable();

        table.ClickEdit(contact.Id);

        Assert.Equal($"/edit-contact/{contact.Id}", CurrentPath);
    }

    [Fact]
    public void ClickCreate_NavigatesToCreatePage()
    {
        ApiService.ReturnsContacts();
        var table = RenderTable();

        table.ClickCreate();

        Assert.Equal("/create-contact", CurrentPath);
    }

    [Fact]
    public void LoadFailure_ShowsErrorAlert()
    {
        ApiService.ThrowsOnGetContacts(new InvalidOperationException("boom"));

        var table = RenderTable();

        Assert.Contains("boom", table.ErrorAlertText);
        Assert.Equal("boom", table.ErrorBannerText);
    }

    [Fact]
    public void SortBy_FirstName_ReordersRows()
    {
        var a = ContactBuilder.Existing.Valid() with { FirstName = "Zed" };
        var b = ContactBuilder.Existing.Valid() with { FirstName = "Adam" };
        ApiService.ReturnsContacts(a, b);
        var table = RenderTable();

        table.SortBy("First Name");

        table.WaitForLoaded();
        Assert.Equal([b.Id, a.Id], table.RowIds);
    }

    [Fact]
    public void NextPageAndPreviousPage_MoveBetweenPages_AndPagerInfoFollows()
    {
        var contacts = ContactBuilder.Existing.List(12);
        ApiService.ReturnsContacts(contacts.ToArray());
        var table = RenderTable();
        Assert.Equal("1-10 of 12", table.PagerInfo);

        table.NextPage();
        table.WaitForLoaded();
        Assert.Equal("11-12 of 12", table.PagerInfo);

        table.PreviousPage();
        table.WaitForLoaded();
        Assert.Equal("1-10 of 12", table.PagerInfo);
    }

    [Fact]
    public async Task RowsPerPage_DefaultsAndCanBeChanged()
    {
        ApiService.ReturnsContacts(ContactBuilder.Existing.List(2).ToArray());
        var table = RenderTable();
        var initial = table.RowsPerPage;

        await table.SelectRowsPerPageAsync(initial == 25 ? 50 : 25);

        Assert.NotEqual(initial, table.RowsPerPage);
    }
}
