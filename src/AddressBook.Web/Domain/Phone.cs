namespace AddressBook.Web.Domain;

public class Phone
{
  public int Id { get; set; }
  public int ContactId { get; set; }
  public Contact Contact { get; set; }
  public int PhoneOperatorId { get; set; }
  public string PhoneNumber { get; set; } = string.Empty;
  public string Comment { get; set; } = string.Empty;
  public PhoneOperator PhoneOperator { get; set; }
}
