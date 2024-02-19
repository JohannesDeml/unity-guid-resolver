using System;
using System.Collections.Generic;

namespace JD.GuidResolver.Editor
{
	/// <summary>
	/// Class structure that will be used to serialize the mapping to json
	/// </summary>
	[Serializable]
	public class GuidMapping
	{
		/// <summary>
		/// Product name of the project to give context in the extension what mapping is loaded
		/// </summary>
		public string identifier;
		/// <summary>
		/// Sortable date string when the mapping was created
		/// </summary>
		public string creationDate;
		/// <summary>
		/// File version can be used to check if the mapping is compatible with the extension
		/// </summary>
		public int fileVersion;
		/// <summary>
		/// The actual mapping of GUIDs to file meta data
		/// </summary>
		public Dictionary<string, GuidMappingEntry> mapping;

		public GuidMapping(string identifier)
		{
			this.identifier = identifier;
			this.creationDate = DateTime.Now.ToString("s");
			this.fileVersion = GuidMappingGenerator.FileVersion;
			this.mapping = new Dictionary<string, GuidMappingEntry>();
		}
	}

	/// <summary>
	/// Metadata of a guid mapping - Keep this class small to avoid size explosion of the json file
	/// </summary>
	[Serializable]
	public class GuidMappingEntry
	{
		public string fileName;
	}
}