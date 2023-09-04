// import * as TaskManager from "expo-task-manager";
// import * as BackgroundFetch from "expo-background-fetch";

// const BACKGROUND_SYNC_TASK = "BACKGROUND_SYNC_TASK";

// export const defineSyncTask = () => {
//   TaskManager.defineTask(BACKGROUND_SYNC_TASK, async ({ data, error }) => {
//     if (error) {
//       console.error("Error in synchronization task:", error);
//       return;
//     }

//     const now = Date.now();

//     console.log(
//       `Got background fetch call at date: ${new Date(now).toISOString()}`
//     );

//     // Be sure to return the successful result type!
//     return BackgroundFetch.BackgroundFetchResult.NewData;
//   });
// };

// export async function registerBackgroundFetchAsync() {
//   return BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
//     minimumInterval: 60 * 15, // 15 minutes
//     stopOnTerminate: false, // android only,
//     startOnBoot: true, // android only
//   });
// }
