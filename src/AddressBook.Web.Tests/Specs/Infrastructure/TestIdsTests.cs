using System.Reflection;
using System.Text.RegularExpressions;
using AddressBook.Web.Layout;

namespace AddressBook.Web.Tests.Specs.Infrastructure;

public partial class TestIdsTests : MudTestContext
{
    [GeneratedRegex("""data-testid="([a-z0-9-]+)"(?!\w)""")]
    private static partial Regex StaticTestIdRegex();

    [GeneratedRegex("""data-testid="@\(\$"([a-z0-9-]+-)\{""")]
    private static partial Regex RowPrefixRegex();

    [Fact]
    public void RowHelpers_AppendIdToPrefix()
    {
        Assert.Equal("contact-row-7", TestIds.ContactRow(7));
        Assert.Equal("contact-edit-7", TestIds.ContactEditButton(7));
        Assert.Equal("contact-delete-7", TestIds.ContactDeleteButton(7));
    }

    [Fact]
    public void Selector_WrapsTestIdInAttributeSelector() =>
        Assert.Equal("[data-testid=\"nav-home\"]", TestIds.Selector(TestIds.NavHome));

    [Fact]
    public void Constants_MatchDataTestIdLiteralsInWebMarkup()
    {
        var razorFiles = Directory.GetFiles(FindWebProjectDir(), "*.razor", SearchOption.AllDirectories);
        var razor = string.Concat(razorFiles.Select(File.ReadAllText));

        var markupStatic = StaticTestIdRegex().Matches(razor).Select(m => m.Groups[1].Value).ToHashSet();
        var markupPrefixes = RowPrefixRegex().Matches(razor).Select(m => m.Groups[1].Value).ToHashSet();

        var constants = typeof(TestIds)
            .GetFields(BindingFlags.Public | BindingFlags.Static)
            .Where(f => f is { IsLiteral: true, IsInitOnly: false } && f.FieldType == typeof(string))
            .Select(f => (string)f.GetRawConstantValue()!)
            .ToHashSet();
        var helperPrefixes = new[] { TestIds.ContactRow(0), TestIds.ContactEditButton(0), TestIds.ContactDeleteButton(0) }
            .Select(s => s[..^1])
            .ToHashSet();

        Assert.Equal(markupStatic.Order(), constants.Order());
        Assert.Equal(markupPrefixes.Order(), helperPrefixes.Order());
    }

    [Fact]
    public void NavMenu_RendersLinksFoundByTestIds()
    {
        var cut = Render<NavMenu>();

        Assert.NotNull(cut.Find(TestIds.Selector(TestIds.NavHome)));
        Assert.NotNull(cut.Find(TestIds.Selector(TestIds.NavContacts)));
    }

    private static string FindWebProjectDir()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            var web = Path.Combine(dir.FullName, "AddressBook.Web");
            if (File.Exists(Path.Combine(web, "AddressBook.Web.csproj")))
            {
                return web;
            }
        }

        throw new DirectoryNotFoundException("src/AddressBook.Web not found above " + AppContext.BaseDirectory);
    }
}
