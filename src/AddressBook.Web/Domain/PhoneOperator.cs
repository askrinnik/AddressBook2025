namespace AddressBook.Web.Domain;

/// <summary>
/// Phone operator entity
/// </summary>
public class PhoneOperator
{
  /// <summary>
  /// Phone operator identifier
  /// </summary>
  public PhoneOperatorId Id { get; set; } = PhoneOperatorId.New();

  /// <summary>
  /// Phone operator name
  /// </summary>
  public string Name { get; set; } = string.Empty;

  /// <summary>
  /// Phone operator description
  /// </summary>
  public string Description { get; set; } = string.Empty;

  /// <summary>
  /// A collection of phones with that operator
  /// </summary>
  public IReadOnlyCollection<Phone> Phones { get; set; }= [];
}
