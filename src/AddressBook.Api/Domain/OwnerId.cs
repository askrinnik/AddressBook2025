namespace AddressBook.Api.Domain;

/// <summary>
/// Owner identifier
/// </summary>
/// <param name="Value"></param>
public sealed record OwnerId(int Value)
{
  /// <summary>
  /// Default Owner identifier
  /// </summary>
  /// <returns></returns>
  public static OwnerId Default() => new(1);
}