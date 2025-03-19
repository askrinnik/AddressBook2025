using System.Collections.Generic;

namespace AddressBook.Web.Interfaces;

public interface IRetrieveMany<out TOut>
{
  /// <summary>
  /// Retrieves an enumerable of <typeparamref name="TOut"/> values, optionally using the specified transaction.
  /// </summary>
  /// <returns>An <see cref="IAsyncEnumerable{TOut}"/>.</returns>
  IAsyncEnumerable<TOut> RetrieveManyAsync();
}

public interface IRetrieveMany<in TKey, TOut>
{
  Task<IReadOnlyCollection<TOut>> RetrieveManyAsync(TKey key);
}
