// --------------------------------------------------------------------------------------------------------------------
// <copyright file="GuidMappingGenerator.cs">
//   Copyright (c) 2023 Johannes Deml. All rights reserved.
// </copyright>
// <author>
//   Johannes Deml
//   public@deml.io
// </author>
// --------------------------------------------------------------------------------------------------------------------

using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using UnityEditor;
using UnityEngine;
using Debug = UnityEngine.Debug;

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

		public GuidMapping()
		{
			identifier = Application.productName;
			creationDate = DateTime.Now.ToString("s");
			fileVersion = GuidMappingGenerator.FileVersion;
			mapping = new Dictionary<string, GuidMappingEntry>();
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

	/// <summary>
	/// Generate a mapping of all GUIDs in the project to their file meta data
	/// Used for resolving GUIDs in the web with the extension Unity GUID Resolver
	/// </summary>
	public static class GuidMappingGenerator
	{
		public const int FileVersion = 1;

		[MenuItem("Assets/Generate GUID Mapping")]
		public static void GenerateGuidMappingMenuItem()
		{
			try
			{
				if (!GenerateGuidMapping())
				{
					Debug.Log("Canceled GUID Mapping generation");
				}
			}
			finally
			{
				EditorUtility.ClearProgressBar();
			}
		}

		private static bool GenerateGuidMapping()
		{
			Stopwatch sw = Stopwatch.StartNew();
			var mapping = new GuidMapping();
			if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping", "Collecting GUIDs", 0f))
			{
				return false;
			}

			var guids = AssetDatabase.FindAssets("*");
			for (var i = 0; i < guids.Length; i++)
			{
				if (i % 100 == 0)
				{
					if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping",
							$"Processing GUIDs {i}/{guids.Length}", (float)i / guids.Length))
					{
						return false;
					}
				}

				var guid = guids[i];
				var path = AssetDatabase.GUIDToAssetPath(guid);
				var fileName = path.Substring(path.LastIndexOf('/') + 1);
				mapping.mapping.Add(guid, new GuidMappingEntry()
				{
					fileName = fileName
				});
			}

			string projectFolderPath = Directory.GetParent(Application.dataPath).ToString();
			string folderPath = Path.Combine(projectFolderPath, "Builds");
			// Make sure the folder exists
			Directory.CreateDirectory(folderPath);
			string filePath = Path.Combine(folderPath, $"guid-mapping.json");
			if (EditorUtility.DisplayCancelableProgressBar("Generating GUID Mapping", $"Serialize Json", 1f))
			{
				return false;
			}

			using (StreamWriter file = File.CreateText(filePath))
			{
				JsonSerializer serializer = new JsonSerializer();
				serializer.Serialize(file, mapping);
			}

			Debug.Log($"Generated mapping for {guids.Length} assets at {filePath} in {sw.ElapsedMilliseconds}ms");
			return true;
		}
	}
}