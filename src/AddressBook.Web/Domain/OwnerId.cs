namespace AddressBook.Web.Domain;

/// <summary>
/// Owner identifier
/// </summary>
/// <param name="Value"></param>
public record OwnerId(int Value)
{
  /// <summary>
  /// New Owner identifier
  /// </summary>
  /// <returns></returns>
  public static OwnerId New() => new(0);

  /// <summary>
  /// Default Owner identifier
  /// </summary>
  /// <returns></returns>
  public static OwnerId Default() => new(1);
}