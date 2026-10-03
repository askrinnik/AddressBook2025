namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Явные заглушки JS-вызовов MudBlazor для bUnit. В loose-режиме они не обязательны
/// (неописанные вызовы возвращают default), но фиксируют контракт и не ломаются при переходе на strict.
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
    /// Размер окна браузера для <c>IBrowserViewportService</c>. Без этой заглушки loose-режим отдаёт 0×0
    /// (брейкпоинт Xs) — и responsive-компоненты (например <c>MudDrawer</c>) ведут себя как на телефоне.
    /// </summary>
    public static BunitJSInterop SetupBrowserWindowSize(this BunitJSInterop jsInterop, int width, int height)
    {
        jsInterop.Setup<BrowserWindowSize>(GetBrowserWindowSize)
            .SetResult(new BrowserWindowSize { Width = width, Height = height });

        return jsInterop;
    }
}
