namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Явные заглушки JS-вызовов MudBlazor для bUnit. В loose-режиме они не обязательны
/// (неописанные вызовы возвращают default), но фиксируют контракт и не ломаются при переходе на strict.
/// </summary>
public static class MudBlazorJsInterop
{
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
}
