namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Базовый bUnit-контекст для тестов MudBlazor-компонентов: MudBlazor-сервисы, JSInterop в loose-режиме
/// и подменённый <see cref="IAddressBookApiService"/>.
/// </summary>
public abstract class MudTestContext : BunitContext
{
    protected IAddressBookApiService ApiService { get; }

    protected MudTestContext()
    {
        JSInterop.Mode = JSRuntimeMode.Loose;
        JSInterop.SetupMudBlazorJsInterop();

        Services.AddMudServices();

        ApiService = Substitute.For<IAddressBookApiService>();
        Services.AddSingleton(ApiService);
    }

    /// <summary>
    /// Рендерит провайдеры MudBlazor (popover/dialog) в этом контексте. Вызывать до рендера компонента,
    /// использующего overlay-виджеты (диалоги, MudSelect, MudDatePicker).
    /// </summary>
    protected (IRenderedComponent<MudPopoverProvider> Popover, IRenderedComponent<MudDialogProvider> Dialog) RenderProviders() =>
        (Render<MudPopoverProvider>(), Render<MudDialogProvider>());
}
