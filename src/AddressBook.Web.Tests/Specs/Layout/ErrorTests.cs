using AddressBook.Web.ErrorHandling;
using AddressBook.Web.Layout;

namespace AddressBook.Web.Tests.Specs.Layout;

public class ErrorTests : MudTestContext
{
    // Error has no role/aria-label/data-testid (we do not add new testids to Web) - CSS as a last resort.
    private const string BannerSelector = "div.alert.alert-danger";
    private const string MessageSelector = "pre.error-container";

    private IRenderedComponent<Error> RenderError() =>
        Render<Error>(p => p.Add(e => e.ChildContent, b => b.AddMarkupContent(0, "<p id=\"child\">child</p>")));

    private static IReadOnlyList<AngleSharp.Dom.IElement> Banners(IRenderedComponent<Error> cut) => cut.FindAll(BannerSelector);

    [Fact]
    public void Initially_NoBanner_ChildContentRendered()
    {
        var cut = RenderError();

        Assert.Empty(Banners(cut));
        Assert.Equal(string.Empty, cut.Instance.ErrorMessage);
        Assert.Equal("child", cut.Find("#child").TextContent);
    }

    [Fact]
    public async Task ProcessError_ShowsBannerWithMessage_KeepsChildContent()
    {
        var cut = RenderError();

        await cut.InvokeAsync(() => cut.Instance.ProcessError("Something went wrong"));

        var banner = Assert.Single(Banners(cut));
        Assert.Equal("Woops!", banner.QuerySelector("h4.alert-heading")!.TextContent);
        Assert.Equal("Something went wrong", cut.Find(MessageSelector).TextContent);
        Assert.Equal("child", cut.Find("#child").TextContent);
    }

    [Fact]
    public async Task ProcessError_EmptyString_RendersNoBanner()
    {
        var cut = RenderError();

        await cut.InvokeAsync(() => cut.Instance.ProcessError(string.Empty));

        Assert.Empty(Banners(cut));
    }

    [Fact]
    public async Task ProcessError_Twice_ReplacesPreviousMessage()
    {
        var cut = RenderError();

        await cut.InvokeAsync(() => cut.Instance.ProcessError("first"));
        await cut.InvokeAsync(() => cut.Instance.ProcessError("second"));

        Assert.Single(Banners(cut));
        Assert.Equal("second", cut.Find(MessageSelector).TextContent);
    }

    [Fact]
    public async Task ProcessProblem_ShowsExtensionsAsIndentedJson()
    {
        var cut = RenderError();
        var problem = new ClientProblemDetails
        {
            Title = "Validation failed",
            Extensions = new Dictionary<string, object>
            {
                ["traceId"] = "abc-123",
                ["errors"] = new Dictionary<string, string[]> { ["FirstName"] = ["Required"] },
            },
        };

        await cut.InvokeAsync(() => cut.Instance.ProcessProblem(problem));

        Assert.Single(Banners(cut));
        var text = cut.Find(MessageSelector).TextContent;
        Assert.Contains("\"traceId\": \"abc-123\"", text);
        Assert.Contains("\"FirstName\"", text);
        Assert.Contains("\"Required\"", text);
        Assert.Contains('\n', text);
    }

    [Fact]
    public async Task Clear_HidesBanner_AndResetsMessage()
    {
        var cut = RenderError();
        await cut.InvokeAsync(() => cut.Instance.ProcessError("boom"));
        Assert.Single(Banners(cut));

        await cut.InvokeAsync(() => cut.Instance.Clear());

        Assert.Empty(Banners(cut));
        Assert.Equal(string.Empty, cut.Instance.ErrorMessage);
        Assert.Equal("child", cut.Find("#child").TextContent);
    }

    [Fact]
    public async Task Clear_WithoutBanner_IsNoOp()
    {
        var cut = RenderError();

        await cut.InvokeAsync(() => cut.Instance.Clear());

        Assert.Empty(Banners(cut));
        Assert.Equal("child", cut.Find("#child").TextContent);
    }

    [Fact]
    public async Task ProcessError_AfterClear_ShowsBannerAgain()
    {
        var cut = RenderError();
        await cut.InvokeAsync(() => cut.Instance.ProcessError("first"));
        await cut.InvokeAsync(() => cut.Instance.Clear());

        await cut.InvokeAsync(() => cut.Instance.ProcessError("again"));

        Assert.Equal("again", cut.Find(MessageSelector).TextContent);
    }
}
