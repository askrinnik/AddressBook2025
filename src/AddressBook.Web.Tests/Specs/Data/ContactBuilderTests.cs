namespace AddressBook.Web.Tests.Specs.Data;

public class ContactBuilderTests
{
    [Fact]
    public void New_NameLengthVariants_AreExactlyAtAndOverTheLimit()
    {
        Assert.Equal(30, ContactBuilder.New.FirstName30Chars().FirstName.Length);
        Assert.Equal(31, ContactBuilder.New.FirstName31Chars().FirstName.Length);
        Assert.Equal(30, ContactBuilder.New.LastName30Chars().LastName.Length);
        Assert.Equal(31, ContactBuilder.New.LastName31Chars().LastName.Length);
    }

    [Fact]
    public void Existing_DefaultIds_AreUniqueEvenInParallel()
    {
        var ids = Enumerable.Range(0, 500).AsParallel().Select(_ => ContactBuilder.Existing.Valid().Id).ToList();

        Assert.Equal(ids.Count, ids.Distinct().Count());
    }
}
