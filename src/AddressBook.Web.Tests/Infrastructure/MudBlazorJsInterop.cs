namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Explicit stubs for MudBlazor JS calls for bUnit. In loose mode they are not required
/// (unconfigured calls return default), but they pin down the contract and do not break when switching to strict.
/// </summary>
public static class MudBlazorJsInterop
{
    private const string GetBrowserWindowSize = "mudResizeListener.getBrowserWindowSize";

    private static readonly string[] JsModules =
    [
        "mudPopover.",
        "mudKeyInterceptor.",
        "mudScrollManager.",
        "mudScrollListener.",
        "mudResizeListener.",
        "mudResizeObserver.",
        "mudElementRef."
    ];

    public static BunitJSInterop SetupMudBlazorJsInterop(this BunitJSInterop jsInterop)
    {
        foreach (var module in JsModules)
            jsInterop.SetupVoid(invocation => invocation.Identifier.StartsWith(module, StringComparison.Ordinal));

        return jsInterop;
    }

    /// <summary>
    /// Browser window size for <c>IBrowserViewportService</c>. Without this stub, loose mode returns 0x0
    /// (the Xs breakpoint), and responsive components (e.g. <c>MudDrawer</c>) behave as on a phone.
    /// </summary>
    public static BunitJSInterop SetupBrowserWindowSize(this BunitJSInterop jsInterop, int width, int height)
    {
        jsInterop.Setup<BrowserWindowSize>(GetBrowserWindowSize)
            .SetResult(new BrowserWindowSize { Width = width, Height = height });

        return jsInterop;
    }
}
