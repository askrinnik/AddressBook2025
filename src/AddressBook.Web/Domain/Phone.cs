namespace AddressBook.Web.Domain;

/// <summary>
/// Phone entity
/// </summary>
public class Phone
{
  /// <summary>
  /// Phone identifier
  /// </summary>
  public int Id { get; set; }

  /// <summary>
  /// Contact identifier
  /// </summary>
  public int ContactId { get; set; }

  /// <summary>
  /// Contact entity
  /// </summary>
  public Contact Contact { get; set; } = null!;

  /// <summary>
  /// Phone operator identifier
  /// </summary>
  public int PhoneOperatorId { get; set; }

  /// <summary>
  /// Phone number
  /// </summary>
  public string PhoneNumber { get; set; } = string.Empty;

  /// <summary>
  /// Comment
  /// </summary>
  public string Comment { get; set; } = string.Empty;

  /// <summary>
  /// Phone operator entity
  /// </summary>
  public PhoneOperator PhoneOperator { get; set; } = null!;
}
