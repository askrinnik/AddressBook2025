namespace AddressBook.Web.Tests.Specs.Infrastructure;

public class MudTestContextTests : MudTestContext
{
    [Fact]
    public void MudComponent_Renders_WithoutJsInteropExceptions()
    {
        var cut = Render<MudButton>(p => p.AddChildContent("Ping"));

        Assert.Contains("Ping", cut.Markup);
        Assert.NotNull(cut.Find("button"));
    }

    [Fact]
    public void Providers_Render_WithoutExceptions()
    {
        var (popover, dialog) = RenderProviders();

        Assert.NotNull(popover.Instance);
        Assert.NotNull(dialog.Instance);
    }

    [Fact]
    public void ApiService_IsRegisteredSubstitute() =>
        Assert.Same(ApiService, Services.GetRequiredService<IAddressBookApiService>());
}
