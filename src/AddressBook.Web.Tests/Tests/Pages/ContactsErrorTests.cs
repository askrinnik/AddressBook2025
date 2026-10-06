namespace AddressBook.Web.Tests.Tests.Pages;

public class ContactsErrorTests : MudTestContext
{
    private const string ErrorMessage = "Service unavailable";

    private ContactsTableHarness RenderTable()
    {
        RenderProviders();
        return ContactsTableHarness.Render(this).WaitForLoaded();
    }

    [Fact]
    public void LoadFailure_ShowsErrorBanner_WithExceptionMessage()
    {
        ApiService.ThrowsOnGetContacts(new HttpRequestException(ErrorMessage));

        var table = RenderTable();

        Assert.Equal(ErrorMessage, table.ErrorBannerText);
    }

    [Fact]
    public void LoadFailure_ShowsVisibleAlert_WithExceptionMessage()
    {
        ApiService.ThrowsOnGetContacts(new HttpRequestException(ErrorMessage));

        var table = RenderTable();

        Assert.Equal(ErrorMessage, table.ErrorAlertText);
        Assert.DoesNotContain("invisible", table.ErrorAlertClass);
    }

    [Fact]
    public void LoadFailure_ShowsNoRows_AndNoRecordsMessage()
    {
        ApiService.ThrowsOnGetContacts(new InvalidOperationException(ErrorMessage));

        var table = RenderTable();

        Assert.Empty(table.RowIds);
        Assert.True(table.IsNoRecordsShown);
    }

    [Fact]
    public void SuccessfulSearchAfterFailure_ClearsAlertText_AndHidesIt()
    {
        ApiService.ThrowsOnGetContacts(new HttpRequestException(ErrorMessage));
        var table = RenderTable();
        ApiService.ReturnsContactsFor("nobody");

        table.Search("nobody");

        table.WaitForLoaded();
        Assert.Null(table.ErrorAlertText);
        Assert.Contains("invisible", table.ErrorAlertClass);
    }

    [Fact]
    public void SuccessfulSearchAfterFailure_ClearsErrorBanner()
    {
        ApiService.ThrowsOnGetContacts(new HttpRequestException(ErrorMessage));
        var table = RenderTable();
        Assert.Equal(ErrorMessage, table.ErrorBannerText);
        ApiService.ReturnsContactsFor("nobody");

        table.Search("nobody");

        table.WaitForLoaded();
        Assert.Null(table.ErrorBannerText);
    }
}
