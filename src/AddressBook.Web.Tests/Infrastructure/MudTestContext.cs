using Microsoft.AspNetCore.Components;

namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Base bUnit context for MudBlazor component tests: MudBlazor services, JSInterop in loose mode,
/// a substituted <see cref="IAddressBookApiService"/> and the system <see cref="TimeProvider"/>.
/// </summary>
public abstract class MudTestContext : BunitContext
{
    protected IAddressBookApiService ApiService { get; }

    /// <summary>Path of the current <c>FakeNavigationManager</c> URI (e.g. <c>/contacts</c>) - for checking navigation.</summary>
    protected string CurrentPath => new Uri(Services.GetRequiredService<NavigationManager>().Uri).AbsolutePath;

    protected MudTestContext()
    {
        JSInterop.Mode = JSRuntimeMode.Loose;
        JSInterop.SetupMudBlazorJsInterop();

        Services.AddMudServices();

        ApiService = Substitute.For<IAddressBookApiService>();
        Services.AddSingleton(ApiService);

        // The pages and the birthday rule read the clock through TimeProvider, as in Program.cs.
        Services.AddSingleton(TimeProvider.System);
    }

    /// <summary>
    /// Replaces the clock with <paramref name="clock"/>. Call before rendering; the last registration wins.
    /// </summary>
    protected void UseClock(TimeProvider clock) => Services.AddSingleton(clock);

    /// <summary>
    /// Renders the MudBlazor providers (popover/dialog) in this context. Call before rendering a component
    /// that uses overlay widgets (dialogs, MudSelect, MudDatePicker).
    /// </summary>
    protected (IRenderedComponent<MudPopoverProvider> Popover, IRenderedComponent<MudDialogProvider> Dialog) RenderProviders() =>
        (Render<MudPopoverProvider>(), Render<MudDialogProvider>());
}
