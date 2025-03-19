namespace AddressBook.Web.Domain;

public class Contact
{
  public int Id { get; set; }
  public int OwnerId { get; set; } = 1;
  public string FirstName { get; set; } = string.Empty;
  public string LastName { get; set; } = string.Empty;
  public DateTime? Birthday { get; set; }
  public IReadOnlyCollection<Phone> Phones { get; set; } = new List<Phone>();
}
