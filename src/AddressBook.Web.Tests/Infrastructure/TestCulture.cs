using System.Globalization;
using System.Runtime.CompilerServices;

namespace AddressBook.Web.Tests.Infrastructure;

/// <summary>
/// Fixes the culture of the whole test assembly to en-US before any test runs, so that date and number
/// formatting in rendered markup does not depend on the regional settings of the machine.
/// </summary>
internal static class TestCulture
{
    private static readonly CultureInfo Culture = CultureInfo.GetCultureInfo("en-US");

    [ModuleInitializer]
    internal static void Initialize()
    {
        CultureInfo.DefaultThreadCurrentCulture = Culture;
        CultureInfo.DefaultThreadCurrentUICulture = Culture;
        CultureInfo.CurrentCulture = Culture;
        CultureInfo.CurrentUICulture = Culture;
    }
}
