namespace AddressBook.Web.Tests.Specs.Infrastructure;

public class RenderedComponentExtensionsTests : MudTestContext
{
    private IRenderedComponent<MudButton> RenderButton() =>
        Render<MudButton>(p => p
            .AddUnmatched("data-testid", "ping")
            .AddUnmatched("aria-label", "Ping button")
            .AddChildContent("Ping"));

    [Fact]
    public void FindByTestId_ReturnsElement()
    {
        var cut = RenderButton();

        Assert.Contains("Ping", cut.FindByTestId("ping").TextContent);
    }

    [Fact]
    public void FindAllByTestId_ReturnsAllMatches()
    {
        var cut = RenderButton();

        Assert.Single(cut.FindAllByTestId("ping"));
        Assert.Empty(cut.FindAllByTestId("missing"));
    }

    [Fact]
    public void TryFindByTestId_ReturnsNull_WhenAbsent()
    {
        var cut = RenderButton();

        Assert.NotNull(cut.TryFindByTestId("ping"));
        Assert.Null(cut.TryFindByTestId("missing"));
    }

    [Fact]
    public void HasTestId_ReflectsPresence()
    {
        var cut = RenderButton();

        Assert.True(cut.HasTestId("ping"));
        Assert.False(cut.HasTestId("missing"));
    }

    [Fact]
    public void FindByAriaLabel_And_TryFindByAriaLabel()
    {
        var cut = RenderButton();

        Assert.Contains("Ping", cut.FindByAriaLabel("Ping button").TextContent);
        Assert.Null(cut.TryFindByAriaLabel("Other"));
    }
}
