using AddressBook.Contracts;

namespace AddressBook.Web.Tests.Specs.Data;

public class ContactBuilderTests
{
    [Fact]
    public void New_NameLengthVariants_AreExactlyAtAndOverTheLimit()
    {
        Assert.Equal(ContactRules.NameMaxLength, ContactBuilder.New.FirstName30Chars().FirstName.Length);
        Assert.Equal(ContactRules.NameMaxLength + 1, ContactBuilder.New.FirstName31Chars().FirstName.Length);
        Assert.Equal(ContactRules.NameMaxLength, ContactBuilder.New.LastName30Chars().LastName.Length);
        Assert.Equal(ContactRules.NameMaxLength + 1, ContactBuilder.New.LastName31Chars().LastName.Length);
    }

    [Fact]
    public void New_BirthdayBoundaryVariants_AreTodayAndTomorrowInUtc()
    {
        var todayUtc = DateTime.UtcNow.Date;

        Assert.Equal(todayUtc, ContactBuilder.New.BirthdayToday().Birthday);
        Assert.Equal(todayUtc.AddDays(1), ContactBuilder.New.BirthdayInFuture().Birthday);
    }

    [Fact]
    public void Existing_DefaultIds_AreUniqueEvenInParallel()
    {
        var ids = Enumerable.Range(0, 500).AsParallel().Select(_ => ContactBuilder.Existing.Valid().Id).ToList();

        Assert.Equal(ids.Count, ids.Distinct().Count());
    }
}
