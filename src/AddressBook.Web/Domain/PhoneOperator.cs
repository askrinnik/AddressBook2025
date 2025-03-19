namespace AddressBook.Web.Domain;

public class PhoneOperator
{
  public int Id { get; set; }
  public string Name { get; set; } = string.Empty;
  public string Description { get; set; } = string.Empty;
  public IReadOnlyCollection<Phone> Phones { get; set; }= new List<Phone>();
}
