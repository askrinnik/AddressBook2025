namespace AddressBook.Web.Tests.Specs.Pages;

public class ContactsListTests : MudTestContext
{
    private ContactsTableHarness RenderTable()
    {
        RenderProviders();
        return ContactsTableHarness.Render(this).WaitForLoaded();
    }

    [Fact]
    public void Renders_RowsFromMock_InResponseOrder()
    {
        var contacts = ContactBuilder.Existing.List(3);
        ApiService.ReturnsContacts(contacts.ToArray());

        var table = RenderTable();

        Assert.Equal(contacts.Select(c => c.Id), table.RowIds);
        foreach (var contact in contacts)
        {
            var (first, last, birthday) = table.RowText(contact.Id);
            Assert.Equal(contact.FirstName, first);
            Assert.Equal(contact.LastName, last);
            Assert.Equal(contact.Birthday?.ToShortDateString(), birthday);
        }
    }

    [Fact]
    public void Renders_EmptyBirthdayCell_WhenBirthdayIsMissing()
    {
        var contact = ContactBuilder.Existing.WithoutBirthday();
        ApiService.ReturnsContacts(contact);

        var table = RenderTable();

        Assert.Equal(string.Empty, table.RowText(contact.Id).Birthday);
    }

    [Fact]
    public void InitialLoad_RequestsContactsWithEmptyTerm()
    {
        ApiService.ReturnsContacts(ContactBuilder.Existing.List(1).ToArray());

        RenderTable();

        ApiService.ReceivedSearch(string.Empty);
    }

    [Fact]
    public void Search_RequestsTermAndReloadsRows()
    {
        var found = ContactBuilder.Existing.Valid();
        ApiService.ReturnsContacts(ContactBuilder.Existing.List(3).ToArray());
        ApiService.ReturnsContactsFor("smith", found);
        var table = RenderTable();

        table.Search("smith");

        ApiService.ReceivedSearch("smith");
        table.WaitForLoaded();
        Assert.Equal([found.Id], table.RowIds);
    }

    [Fact]
    public void ClearingSearch_ReloadsWithEmptyTerm()
    {
        var all = ContactBuilder.Existing.List(3);
        var found = ContactBuilder.Existing.Valid();
        ApiService.ReturnsContacts(all.ToArray());
        ApiService.ReturnsContactsFor("smith", found);
        var table = RenderTable();
        table.Search("smith");
        table.WaitForLoaded();

        table.Search(string.Empty);

        table.WaitForLoaded();
        ApiService.ReceivedSearch(string.Empty, times: 2);
        Assert.Equal(all.Select(c => c.Id), table.RowIds);
    }

    [Fact]
    public void Search_WithNoMatches_ShowsNoRecords()
    {
        ApiService.ReturnsContacts(ContactBuilder.Existing.List(2).ToArray());
        ApiService.ReturnsContactsFor("zzz");
        var table = RenderTable();

        table.Search("zzz");

        table.WaitForLoaded();
        Assert.True(table.IsNoRecordsShown);
        Assert.Equal(0, table.RowCount);
    }

    [Fact]
    public void SortBy_FirstName_SortsAscendingThenDescending()
    {
        var zed = ContactBuilder.Existing.Valid() with { FirstName = "Zed" };
        var mia = ContactBuilder.Existing.Valid() with { FirstName = "Mia" };
        var adam = ContactBuilder.Existing.Valid() with { FirstName = "Adam" };
        ApiService.ReturnsContacts(zed, mia, adam);
        var table = RenderTable();

        table.SortBy("First Name");
        table.WaitForLoaded();
        Assert.Equal([adam.Id, mia.Id, zed.Id], table.RowIds);

        table.SortBy("First Name");
        table.WaitForLoaded();
        Assert.Equal([zed.Id, mia.Id, adam.Id], table.RowIds);
    }

    [Fact]
    public void SortBy_LastName_SortsAscendingThenDescending()
    {
        var clark = ContactBuilder.Existing.Valid() with { LastName = "Clark" };
        var adams = ContactBuilder.Existing.Valid() with { LastName = "Adams" };
        var brown = ContactBuilder.Existing.Valid() with { LastName = "Brown" };
        ApiService.ReturnsContacts(clark, adams, brown);
        var table = RenderTable();

        table.SortBy("Last Name");
        table.WaitForLoaded();
        Assert.Equal([adams.Id, brown.Id, clark.Id], table.RowIds);

        table.SortBy("Last Name");
        table.WaitForLoaded();
        Assert.Equal([clark.Id, brown.Id, adams.Id], table.RowIds);
    }

    [Fact]
    public void SortBy_Birthday_SortsAscendingThenDescending()
    {
        var middle = ContactBuilder.Existing.Valid() with { Birthday = new DateOnly(1990, 6, 15) };
        var oldest = ContactBuilder.Existing.Valid() with { Birthday = new DateOnly(1970, 1, 1) };
        var youngest = ContactBuilder.Existing.Valid() with { Birthday = new DateOnly(2005, 12, 31) };
        ApiService.ReturnsContacts(middle, youngest, oldest);
        var table = RenderTable();

        table.SortBy("Birthday");
        table.WaitForLoaded();
        Assert.Equal([oldest.Id, middle.Id, youngest.Id], table.RowIds);

        table.SortBy("Birthday");
        table.WaitForLoaded();
        Assert.Equal([youngest.Id, middle.Id, oldest.Id], table.RowIds);
    }

    [Fact]
    public void RowsPerPage_DefaultsToTen_AndLimitsVisibleRows()
    {
        var contacts = ContactBuilder.Existing.List(12);
        ApiService.ReturnsContacts(contacts.ToArray());

        var table = RenderTable();

        Assert.Equal(10, table.RowsPerPage);
        Assert.Equal(contacts.Take(10).Select(c => c.Id), table.RowIds);
    }

    [Fact]
    public void PagerInfo_OnFirstPage_ShowsRangeAndTotal()
    {
        ApiService.ReturnsContacts(ContactBuilder.Existing.List(12).ToArray());

        var table = RenderTable();

        Assert.Equal("1-10 of 12", table.PagerInfo);
    }

    [Fact]
    public void NextPage_ShowsLastTwoRows_InSourceOrder()
    {
        var contacts = ContactBuilder.Existing.List(12);
        ApiService.ReturnsContacts(contacts.ToArray());
        var table = RenderTable();

        table.NextPage();

        table.WaitForLoaded();
        Assert.Equal(contacts.Skip(10).Select(c => c.Id), table.RowIds);
        Assert.Equal("11-12 of 12", table.PagerInfo);
    }

    [Fact]
    public void PreviousPage_ReturnsFirstTenRows()
    {
        var contacts = ContactBuilder.Existing.List(12);
        ApiService.ReturnsContacts(contacts.ToArray());
        var table = RenderTable();
        table.NextPage();
        table.WaitForLoaded();

        table.PreviousPage();

        table.WaitForLoaded();
        Assert.Equal(contacts.Take(10).Select(c => c.Id), table.RowIds);
        Assert.Equal("1-10 of 12", table.PagerInfo);
    }

    [Fact]
    public void SortBy_OnSecondPage_SortsWholeSet_NotOnlyCurrentPage()
    {
        // Source order is descending by first name, so the current second page holds the two
        // smallest names; a page-local sort would show them, a whole-set sort shows the two largest.
        var contacts = Enumerable.Range(1, 12).Reverse()
            .Select(i => ContactBuilder.Existing.Valid() with { FirstName = $"Name{i:D2}" })
            .ToArray();
        ApiService.ReturnsContacts(contacts);
        var table = RenderTable();
        table.NextPage();
        table.WaitForLoaded();

        table.SortBy("First Name");

        table.WaitForLoaded();
        var sorted = contacts.OrderBy(c => c.FirstName).ToArray();
        Assert.Equal(sorted.Skip(10).Select(c => c.Id), table.RowIds);
        Assert.Equal("11-12 of 12", table.PagerInfo);
    }

    [Fact]
    public async Task RowsPerPage_ChangeOnSecondPage_ReturnsToFirstPageWithAllRows()
    {
        var contacts = ContactBuilder.Existing.List(12);
        ApiService.ReturnsContacts(contacts.ToArray());
        var table = RenderTable();
        table.NextPage();
        table.WaitForLoaded();

        await table.SelectRowsPerPageAsync(25);

        table.WaitForLoaded();
        Assert.Equal(contacts.Select(c => c.Id), table.RowIds);
        Assert.Equal("1-12 of 12", table.PagerInfo);
    }

    [Fact]
    public async Task RowsPerPage_ChangeToTwentyFive_ShowsAllRows()
    {
        var contacts = ContactBuilder.Existing.List(12);
        ApiService.ReturnsContacts(contacts.ToArray());
        var table = RenderTable();

        await table.SelectRowsPerPageAsync(25);

        table.WaitForLoaded();
        Assert.Equal(25, table.RowsPerPage);
        Assert.Equal(contacts.Select(c => c.Id), table.RowIds);
    }
}
