using AddressBook.Web.Pages;
using Microsoft.AspNetCore.Components.Web;

namespace AddressBook.Web.Tests.Tests.Pages;

public class HomeTests : MudTestContext
{
    [Fact]
    public void Renders_Heading()
    {
        var cut = Render<Home>();

        Assert.Equal("Contacts application", cut.Find("h1").TextContent);
    }

    [Fact]
    public void Renders_WelcomeText()
    {
        var cut = Render<Home>();

        Assert.Contains("Welcome to your Contacts app.", cut.Markup);
    }

    [Fact]
    public void PageTitle_SetsDocumentTitleToHome()
    {
        var head = Render<HeadOutlet>();

        Render<Home>();

        head.WaitForAssertion(() => Assert.Equal("Home", head.Find("title").TextContent));
    }

    [Fact]
    public void DoesNotCallApi()
    {
        Render<Home>();

        Assert.Empty(ApiService.ReceivedCalls());
    }
}
