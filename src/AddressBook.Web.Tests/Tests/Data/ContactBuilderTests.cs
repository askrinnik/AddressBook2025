namespace AddressBook.Web.Tests.Tests.Data;

public class ContactBuilderTests
{
    [Fact]
    public void New_Valid_RespectsApiRules()
    {
        for (var i = 0; i < 50; i++)
        {
            var m = ContactBuilder.New.Valid();

            Assert.False(string.IsNullOrWhiteSpace(m.FirstName));
            Assert.False(string.IsNullOrWhiteSpace(m.LastName));
            Assert.InRange(m.FirstName.Length, 1, ContactBuilder.MaxNameLength);
            Assert.InRange(m.LastName.Length, 1, ContactBuilder.MaxNameLength);
            Assert.NotNull(m.Birthday);
            Assert.True(m.Birthday < DateTime.Today);
        }
    }

    [Fact]
    public void New_WithoutBirthday_HasNullBirthday() =>
        Assert.Null(ContactBuilder.New.WithoutBirthday().Birthday);

    [Fact]
    public void New_NameLengthVariants_AreExactlyAtAndOverTheLimit()
    {
        Assert.Equal(30, ContactBuilder.New.FirstName30Chars().FirstName.Length);
        Assert.Equal(31, ContactBuilder.New.FirstName31Chars().FirstName.Length);
        Assert.Equal(30, ContactBuilder.New.LastName30Chars().LastName.Length);
        Assert.Equal(31, ContactBuilder.New.LastName31Chars().LastName.Length);
    }

    [Fact]
    public void New_LengthVariants_ChangeOnlyTheirOwnField()
    {
        var m = ContactBuilder.New.FirstName31Chars();

        Assert.InRange(m.LastName.Length, 1, ContactBuilder.MaxNameLength);
        Assert.NotNull(m.Birthday);
    }

    [Fact]
    public void New_EmptyAndWhitespaceVariants_SetOnlyTheTargetField()
    {
        Assert.Equal(string.Empty, ContactBuilder.New.EmptyFirstName().FirstName);
        Assert.Equal(string.Empty, ContactBuilder.New.EmptyLastName().LastName);
        Assert.Equal("   ", ContactBuilder.New.WhitespaceFirstName().FirstName);
        Assert.Equal("   ", ContactBuilder.New.WhitespaceLastName().LastName);
        Assert.False(string.IsNullOrWhiteSpace(ContactBuilder.New.EmptyFirstName().LastName));
    }

    [Fact]
    public void New_BirthdayVariants_AreTodayAndTomorrow()
    {
        Assert.Equal(DateTime.Today, ContactBuilder.New.BirthdayToday().Birthday);
        Assert.Equal(DateTime.Today.AddDays(1), ContactBuilder.New.BirthdayInFuture().Birthday);
    }

    [Fact]
    public void Existing_Valid_MapsBirthdayToDateOnly()
    {
        var c = ContactBuilder.Existing.Valid();

        Assert.NotNull(c.Birthday);
        Assert.True(c.Birthday < DateOnly.FromDateTime(DateTime.Today));
        Assert.Null(ContactBuilder.Existing.WithoutBirthday().Birthday);
    }

    [Fact]
    public void Existing_ExplicitId_IsUsed() =>
        Assert.Equal(42, ContactBuilder.Existing.Valid(42).Id);

    [Fact]
    public void Existing_DefaultIds_AreUniqueEvenInParallel()
    {
        var ids = Enumerable.Range(0, 500).AsParallel().Select(_ => ContactBuilder.Existing.Valid().Id).ToList();

        Assert.Equal(ids.Count, ids.Distinct().Count());
    }

    [Fact]
    public void Existing_List_ReturnsRequestedCountWithUniqueIds()
    {
        var list = ContactBuilder.Existing.List(10);

        Assert.Equal(10, list.Count);
        Assert.Equal(10, list.Select(c => c.Id).Distinct().Count());
    }

    [Fact]
    public void Existing_Variants_MirrorTheNewOnes()
    {
        Assert.Equal(31, ContactBuilder.Existing.FirstName31Chars().FirstName.Length);
        Assert.Equal(30, ContactBuilder.Existing.LastName30Chars().LastName.Length);
        Assert.Equal("   ", ContactBuilder.Existing.WhitespaceFirstName().FirstName);
        Assert.Equal(DateOnly.FromDateTime(DateTime.Today), ContactBuilder.Existing.BirthdayToday().Birthday);
        Assert.Equal(DateOnly.FromDateTime(DateTime.Today.AddDays(1)), ContactBuilder.Existing.BirthdayInFuture().Birthday);
    }
}
